
const amqp = require('amqplib');
const uuid = require('node-uuid');


const queue_name = 'control_queue';

const SE_get_abort_gui_info = '{"request":{"name":"SE_get_abort_gui_info","args":{}}}';

// const options =
//   {
//     credentials: amqp.credentials.plain('admin', '123123'),
//     virtualHost: '/'
//   };

amqp.connect('amqp://admin:123123@172.16.50.9:5672').then(function(conn) {
  return conn.createChannel().then(function(ch) {
    return new Promise(function(resolve) {
      const corrId = uuid();
      function maybeAnswer(msg) {
        if (msg.properties.correlationId === corrId) {
          resolve(msg.content.toString());
        }
      }

      let ok = ch.assertQueue('', {exclusive: true})
        .then(function(qok) { return qok.queue; });

      ok = ok.then(function(queue) {
        return ch.consume(queue, maybeAnswer, {noAck: true})
          .then(function() { return queue; });
      });

      ok = ok.then(function(queue) {
        console.log(`send ${ SE_get_abort_gui_info }`);
        ch.sendToQueue(queue_name, Buffer.from(SE_get_abort_gui_info), {
          correlationId: corrId, replyTo: queue
        });
      });
    });
  })
    .then(function(msg) {
      console.log(msg);
    })
    .finally(function() { conn.close(); });
}).catch(console.warn);

// consumidor_envio.js
const amqp = require("amqplib");
const axios = require("axios");

async function enviarPedidosParaLogistica() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  const queue = "pedidos_processados";

  await channel.assertQueue(queue, { durable: false });

  console.log("Aguardando pedidos processados...");

  channel.consume(queue, async (msg) => {
    const pedido = JSON.parse(msg.content.toString());

    console.log("Pedido processado recebido:", pedido);

    try {
      const response = await axios.post(
        "http://sistema-envio.com/api/agendar-entrega",
        pedido
      );
      console.log(
        "Pedido enviado para o sistema de envio/logística:",
        response.data
      );
    } catch (error) {
      console.error(
        "Erro ao enviar pedido para o sistema de envio/logística:",
        error
      );
    }

    channel.ack(msg);
  });
}

enviarPedidosParaLogistica();

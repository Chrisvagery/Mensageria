// produtor.js
const amqp = require("amqplib");

async function enviarPedido() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  const queue = "pedidos";

  await channel.assertQueue(queue, { durable: false });

  const pedido = {
    id: 1,
    cliente: "Cliente Exemplo",
    produtos: ["Produto A", "Produto B"],
    total: 100.0,
  };

  channel.sendToQueue(queue, Buffer.from(JSON.stringify(pedido)));
  console.log("Pedido enviado:", pedido);

  setTimeout(() => {
    connection.close();
    process.exit(0);
  }, 500);
}

enviarPedido();

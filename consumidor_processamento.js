// consumidor_processamento.js
const amqp = require("amqplib");
const mysql = require("mysql");

async function processarPedidos() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  const queue = "pedidos";

  
  await channel.assertQueue(queue, { durable: false });

  console.log("Aguardando pedidos...");

  channel.consume(queue, async (msg) => {
    const pedido = JSON.parse(msg.content.toString());

    console.log("Pedido recebido para processamento:", pedido);

    const db = mysql.createConnection({
      host: "localhost",
      user: "usuario",
      password: "a senha",
      database: "nome do banco",
    });

    db.connect();

    const sql = `INSERT INTO pedido (id, cliente, produtos, total) VALUES (?, ?, ?, ?)`;
    const values = [
      pedido.id,
      pedido.cliente,
      JSON.stringify(pedido.produtos),
      pedido.total,
    ];

    db.query(sql, values, (error, results, fields) => {
      if (error) throw error;
      console.log("Pedido registrado no banco de dados.");
    });

    db.end();

    channel.ack(msg);
  });
}

processarPedidos();

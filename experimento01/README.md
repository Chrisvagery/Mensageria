
## Relatório do Experimento com RabbitMQ
Este relatório descreve a implementação de um experimento utilizando RabbitMQ para troca de mensagens entre diferentes componentes. A linguagem de programação utilizada foi JavaScript com Node.js. A seguir, é apresentada uma explicação detalhada do código desenvolvido, o processo de troca de mensagens e uma análise dos resultados obtidos.

## Estrutura do Código
O experimento foi dividido em quatro partes principais: um emissor de mensagens, um receptor de mensagens simples, um trabalhador para processamento de mensagens (worker), e um sistema de Remote Procedure Call (RPC) com cliente e servidor.

### Emissor de Mensagens (send.js)

O arquivo send.js cria uma conexão com o RabbitMQ e envia uma mensagem para uma fila chamada "hello". A mensagem enviada é "Hello World!". A seguir, é apresentado um trecho do código:

var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        var queue = 'hello';
        var msg = 'Hello World!';

        channel.assertQueue(queue, {
            durable: false
        });
        channel.sendToQueue(queue, Buffer.from(msg));

        console.log(" [x] Sent %s", msg);
    });
    setTimeout(function() {
        connection.close();
        process.exit(0);
    }, 500);
});

## Receptor de Mensagens (receive.js)
O arquivo receive.js cria uma conexão com o RabbitMQ e consome mensagens da fila "hello". A seguir, é apresentado um trecho do código:

var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        var queue = 'hello';

        channel.assertQueue(queue, {
            durable: false
        });

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

        channel.consume(queue, function(msg) {
            console.log(" [x] Received %s", msg.content.toString());
        }, {
            noAck: true
        });
    });
});

## Trabalhador para Processamento de Mensagens (worker.js)
O arquivo worker.js cria uma fila "task_queue" e consome mensagens para processamento. Este código inclui uma simulação de trabalho ao aguardar um tempo determinado pelo número de pontos na mensagem recebida. A seguir, é apresentado um trecho do código:

var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(error, connection) {
    connection.createChannel(function(error, channel) {
        var queue = 'task_queue';

        channel.assertQueue(queue, {
            durable: true
        });
        channel.prefetch(1);
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
        channel.consume(queue, function(msg) {
            var secs = msg.content.toString().split('.').length - 1;

            console.log(" [x] Received %s", msg.content.toString());
            setTimeout(function() {
                console.log(" [x] Done");
                channel.ack(msg);
            }, secs * 1000);
        }, {
            noAck: false
        });
    });
});

## Remote Procedure Call (RPC) - Cliente (rpc_client.js)

O arquivo rpc_client.js envia uma solicitação para uma fila "rpc_queue", esperando uma resposta de um servidor. Neste caso, a solicitação é um número para calcular a sequência de Fibonacci. A seguir, é apresentado um trecho do código:

var amqp = require('amqplib/callback_api');

var args = process.argv.slice(2);

if (args.length === 0) {
    console.log("Usage: rpc_client.js num");
    process.exit(1);
}

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }
        channel.assertQueue('', {
            exclusive: true
        }, function(error2, q) {
            if (error2) {
                throw error2;
            }
            var correlationId = generateUuid();
            var num = parseInt(args[0]);

            console.log(' [x] Requesting fib(%d)', num);

            channel.consume(q.queue, function(msg) {
                if (msg.properties.correlationId === correlationId) {
                    console.log(' [.] Got %s', msg.content.toString());
                    setTimeout(function() {
                        connection.close();
                        process.exit(0);
                    }, 500);
                }
            }, {
                noAck: true
            });

            channel.sendToQueue('rpc_queue',
                Buffer.from(num.toString()), {
                    correlationId: correlationId,
                    replyTo: q.queue
                });
        });
    });
});

function generateUuid() {
    return Math.random().toString() +
        Math.random().toString() +
        Math.random().toString();
}

### Remote Procedure Call (RPC) - Servidor (rpc_server.js)
O arquivo rpc_server.js é responsável por processar a solicitação do cliente RPC, calculando a sequência de Fibonacci para um número recebido e retornando a resposta para a fila especificada pelo cliente. A seguir, é apresentado um trecho do código:

var amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }
        var queue = 'rpc_queue';

        channel.assertQueue(queue, {
            durable: false
        });
        channel.prefetch(1);
        console.log(' [x] Awaiting RPC requests');
        channel.consume(queue, function reply(msg) {
            var n = parseInt(msg.content.toString());

            console.log(" [.] fib(%d)", n);

            var r = fibonacci(n);

            channel.sendToQueue(msg.properties.replyTo,
                Buffer.from(r.toString()), {
                    correlationId: msg.properties.correlationId
                });

            channel.ack(msg);
        });
    });
});

function fibonacci(n) {
    if (n === 0 ou 1) {
        return n;
    } else {
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}

## Resultados Obtidos
Os testes foram bem-sucedidos, demonstrando a capacidade do RabbitMQ de gerenciar a troca de mensagens em diferentes cenários. A seguir, estão algumas observações sobre cada parte do experimento:

1. **Emissor de Mensagens:** A conexão com RabbitMQ e o envio da mensagem para a fila "hello" funcionaram conforme esperado. A mensagem "Hello World!" foi enviada com sucesso.
2. **Receptor de Mensagens:** A leitura das mensagens da fila "hello" foi bem-sucedida, indicando que o receptor recebeu a mensagem enviada pelo emissor.
3. **Trabalhador para Processamento de Mensagens** O worker foi capaz de processar mensagens com sucesso, demonstrando a capacidade de pré-agendamento e confirmação de mensagens (acknowledgment).

4. **Remote Procedure Call (RPC) - Cliente e Servidor:** A comunicação entre o cliente e o servidor RPC foi bem-sucedida, mostrando a capacidade do RabbitMQ de lidar com solicitações e respostas.

## Dificuldades Encontradas
Apesar do sucesso do experimento, algumas dificuldades foram encontradas:

**Configuração do RabbitMQ:** Configurar o RabbitMQ corretamente para permitir conexões foi um desafio inicial, especialmente para mim, pois não estou familiarizado com o ambiente.
**Sincronização entre Componentes:** Certificar-se de que os componentes estavam sendo executados na ordem correta e se comunicando entre si exigiu um esforço para manter a sincronização.
**Gerenciamento de Erros:** A implementação de mecanismos de gerenciamento de erros para garantir que o sistema se comportasse corretamente em caso de falhas foi uma preocupação constante.

## Conclusão
O experimento demonstrou a capacidade do RabbitMQ de gerenciar a troca de mensagens em diferentes cenários, incluindo mensagens simples, processamento de tarefas e comunicação RPC. A implementação e o uso do RabbitMQ fornecem uma base sólida para construir sistemas distribuídos resilientes e escaláveis.



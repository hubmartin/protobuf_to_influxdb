var protobuf = require("protobufjs");
const http = require('http');
var moment = require('moment');
const Influx = require('influx');
const os = require('os');

/*
curl -X POST -H "Content-Type: application/json" --data '{"app_id":"sen_mon","dev_id":"sen_mon","hardware_serial":"0003D7CD3CBE2852","port":1,"counter":12,"payload_raw":"CA0aBgitIxCHQSChEyi1JjAHOAFAigU=","metadata":{"time":"2020-11-06T14:21:07.72757174Z","frequency":867.3,"modulation":"LORA","data_rate":"SF8BW125","coding_rate":"4/5","gateways":[{"gtw_id":"eui-58a0cbfffe8002ff","timestamp":1992542716,"time":"2020-11-06T14:21:07.683657884Z","channel":0,"rssi":-44,"snr":11.25,"rf_chain":0}]},"downlink_url":""}' <your_ip>:3000
*/

const port = process.env.PORT || 3000

var pb_message;

protobuf.load("message.proto", function(err, root) {
    if (err)
        throw err;

    // Obtain a message type
    pb_message = root.lookup("pb_packet_lora_t");

    const influx = new Influx.InfluxDB({
        host: '192.168.5.2',
        database: 'node'
    })

    const server = http.createServer((req, res) => {
        if (req.method == 'POST') {
            console.log('POST')
            var body = ''
            req.on('data', function(data) {
                body += data
                //console.log('Partial body: ' + body)
            })
            req.on('end', function() {
                //console.log('Body: ' + body)
                res.writeHead(200, {'Content-Type': 'aplication/json'})
    
                j = JSON.parse(body);
    
                //console.log("raw:" + j.payload_raw);
    
                var data = new Buffer(j.payload_raw, 'base64');
    
                var message = pb_message.decode(data);
                var json_str = JSON.stringify(message, null, 4)
    
                console.log(moment().format('MMMM Do YYYY, HH:mm:ss'));
                console.log(json_str);
    
                //var influx_json = JSON.parse(message)
    
                influx.writePoints([
                    {
                      measurement: 'protob',
                      tags: { host: os.hostname() },
                      fields: {co2: message.co2, sequence: message.sequence, pir: message.pir},
                    }
                  ])
    
                res.end(json_str)
            });
        } else {
                res.end(`<h1>Hello World</h1>`)
        }
    });
    
    server.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
});


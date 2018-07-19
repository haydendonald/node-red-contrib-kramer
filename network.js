var commands = require("./commands.js");
module.exports = function(RED)
{

    //Main function
    function Network(config)
    {
        RED.nodes.createNode(this, config);
        this.ipAddress = config.ipAddress;
        this.port = config.port;
        this.deviceId = config.deviceId;
        this.server = require("./tcp.js");
        this.nodes = [];
        var network = this;
        this.link = function link(node) {
            this.nodes.push(node);
        }

        //Inital connection
        sendStatus(network, "yellow", "Attempting connection...");
        network.server.connect(network.port, network.ipAddress, function() {
            sendStatus(network, "yellow", "Sending ACK");
            connect(network.server, network.deviceId, function(state) {
                if(state == true) {
                    sendStatus(network, "green", "Connected!");
                }
                else {
                    sendStatus(network, "red", "Failed to Connect");
                    RED.log.error("ERROR: Failed to send ACK");
                }
            });
        });

        //Add the incoming callback
        network.server.setIncomingCallback(function(message) {
            var msg = {
                "payload":commands.findFunction(message, network.deviceId)
            };
            if(msg.payload == undefined){return;}
            sendMsg(network, msg);
            sendStatus(network, "green", "Got Data!");
        });

        //Add the error callback
        network.server.setErrorCallback(function(error, description) {
            var nodeText = "";
            var errorText = "";
            switch(error) {
                case "socket": nodeText = "Socket Error: " + description; errorText = "Socket Error: " + description; break;
                case "disconnected": nodeText = "Disconnected"; errorText = "Disconnected: " + description; break;
                case "cannot send": nodeText = "Cannot Send"; errorText = "Not Connected Cannot Send!"; break;
                default: nodeText = "Unknown Error"; errorText = "Unknown Error: " + error + ", " + description; break;
            }

            RED.log.error(errorText.toString());
            sendStatus(network, "red", nodeText.toString());
        });
      
		//When the flows are stopped
        this.on("close", function() {
            network.server.close();
            network.nodes = [];
        });
    }

    //Add the node
    RED.nodes.registerType("kramer-network", Network);
}

//Send out the message to all the nodes
function sendMsg(network, msg) {
    for(var i = 0; i < network.nodes.length; i++) {
        //Only send the message if required
        if(network.nodes[i].sendMsg == true || network.nodes[i].alwaysSend == true) {
            network.nodes[i].send(msg);
            network.nodes[i].sendMsg = false;
        }
    }
}

//Send status to each node
function sendStatus(network, color, nodeText) {
    for(var i = 0; i < network.nodes.length; i++) {
        network.nodes[i].status({fill:color,shape:"dot",text:nodeText});
    }
}


//Connect
function connect(server, deviceId, callback) {
    var buffer = new Buffer(1);
    buffer.writeInt8(0x0D);
    server.send(buffer, 
    //Success
    function(state) {
        if(state == true) {
            callback(true);
        }
        else {
            callback(false);
        }
    },
    //Response
    function(message) {
        if(message[0] == "0x0D"){
            return true;
        }
        else {
            return false;
        }
    });
}
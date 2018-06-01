//var tcp = require('net');
var eventEmitter = require("events");
var commands = require("./commands.js");
var server = require("./tcp.js");
class EventEmitter extends eventEmitter{}
module.exports = function(RED)
{
    //Main Function
    function Kramer(config)
    {
        const emitter = new EventEmitter();
        RED.nodes.createNode(this, config);
        var deviceId = config.deviceId;
        var ipAddress = config.ipAddress;
        var port = config.port;
        var node = this;
        var connected = false;
        var commandBuffer = [];
        var md5Hash;

        node.status({fill:"yellow",shape:"dot",text:"Attempting Connection..."});
        server.connect(port, ipAddress, function() {
            node.status({fill:"yellow",shape:"dot",text:"Sending ACK"});
            connect(server, deviceId, ipAddress, port, function(state) {
                if(state == true) {
                    node.status({fill:"green",shape:"dot",text:"Connected!"});
                }
                else {
                    node.status({fill:"red",shape:"dot",text:"Failed To Connect"});
                }
            });
        });

        //Add the incoming callback
        server.setIncomingCallback(function(message) {
            var msg = {
                "payload":commands.findFunction(message, deviceId)
            };
            if(msg.payload == undefined){return;}
            node.send(msg);
            node.status({fill:"green",shape:"dot",text:"Got Data!"}); 
        });

        //Add the error callback
        server.setErrorCallback(function(error, description) {
            var nodeText = "";
            var errorText = "";
            switch(error) {
                case "socket": nodeText = "Socket Error"; errorText = "Socket Error: " + description; break;
                case "disconnected": nodeText = "Disconnected"; errorText = "Disconnected: " + description; break;
                default: nodeText = "Unknown Error"; errorText = "Unknown Error: " + error + ", " + description; break;
            }

            RED.log.error(errorText.toString());
            node.status({fill:"red",shape:"dot",text:nodeText.toString()}); 
        });


        node.on("close", function() {
            server.close();
        });

        node.on("input", function(msg) {
            if(msg.payload !== undefined && msg.payload !== null){
                if(msg.payload.type != "set" && msg.payload.type != "get"){
                    RED.log.warn("msg.payload.type Must Be set or get");
                    node.status({fill:"yellow",shape:"dot",text:"Syntax Error"});
                }
                else if(msg.payload.func === undefined || msg.payload.func === null){
                    RED.log.warn("msg.payload.func Must Exist");
                    node.status({fill:"yellow",shape:"dot",text:"Syntax Error"});
                }
                else if(msg.payload.param === undefined || msg.payload.param === null){
                    RED.log.warn("msg.payload.param Must Exist");
                    node.status({fill:"yellow",shape:"dot",text:"Syntax Error"});
                }
                else {
                    //Send it!
                    var callback = function(state) {
                        if(state == true) {
                            node.status({fill:"green",shape:"dot",text:"Sent!"});
                        }
                        else if(state == false) {
                            RED.log.error("Failed To Send Command");
                            node.status({fill:"red",shape:"dot",text:"Failed To Send"});
                        }
                        else {
                            var msg = {
                                "topic":"response",
                                "payload":state
                            }
                            node.send(msg);
                            node.status({fill:"green",shape:"dot",text:"Got Response"});
                        }
                    }

                    node.status({fill:"yellow",shape:"dot",text:"Sending..."});
                    if(msg.topic == "raw") {
                        sendOutCommand(server, deviceId, msg.payload.type, msg.payload.func, msg.payload.param, callback);
                    }
                    else {
                        sendOutCommand(server, deviceId, msg.payload.type, commands.getFunction(msg.payload.func), commands.getParameter(msg.payload.func, msg.payload.param), callback);
                    }
                }
            }
        });
    }
    RED.nodes.registerType("kramer-kramer", Kramer);
}

//Connect
function connect(server, deviceId, ipAddress, port, callback) {
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

//Send out a raw command
function sendOutCommand(server, deviceId, type, func, param, callback) {
    var sent = false;
    var returnedValue = undefined;
    if(type == "set"){type="0";}
    else if(type == "get"){type="1";}
    if(param == "" || param == undefined || param == null) {
        var sendOutString = "#" + deviceId + "@Y " + type + "," + func;
    }
    else {
        var sendOutString = "#" + deviceId + "@Y " + type + "," + func + "," + param;;
    }
    var buffer = new Buffer(sendOutString.length + 1);
    buffer.write(sendOutString);
    buffer.writeInt8(0x0D, buffer.length - 1);
    server.send(buffer, 
        //Success callback
        function(state) {
            if(state == true) {
                if(returnedValue !== undefined){
                    callback(returnedValue);
                }
                else {
                    callback(true);
                }
            }
            else {
                callback(false);
            }
        }, 
        //Message callback
        function(message) {
                if(type == "0") {
                    if(message.toString().substr(1).includes(sendOutString.substr(1)) && message.toString().includes("OK")) {
                        return true;
                    }
                }
                else if(type == "1"){ 
                    if(message.toString().substr(1).includes(sendOutString.substr(1))) {
                        returnedValue = message.toString().substr(sendOutString.length + 1);
                        return true;
                    }     
                }
        });
    return sendOutString;
}

//Return the error
function getError(errorId) {
    switch(errorId){
        case "000": return "No Error"; 
        case "001": return "Protocol Synax Error"; 
        case "002": return "Command Not Avaliable";
        case "003": return "Parameter Out Of Range"; 
        case "004": return "Unauthorized"; 
        case "005": return "Internal FW Error"; 
        case "006": return "Busy"; 
        case "007": return "Wrong CRC"; 
        case "008": return "Timed Out"; 
        case "022": return "Packet Missed"; 
        case "021": return "Packet CRC"; 
        case "023": return "Packet Size"; 
        case "030": return "EDID Corupt"; 
        case "031": return "Non Listed"; 
        case "032": return "Same CRC"; 
        case "033": return "Wrong Mode"; 
        case "034": return "Not Configured";
        default: return "Unknown Error: " + errorId; 
    }
}
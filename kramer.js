var commands = require("./commands.js");
module.exports = function(RED)
{
    //Main Function
    function Kramer(config)
    {
        RED.nodes.createNode(this, config);
        var network = RED.nodes.getNode(config.network);
        var node = this;
        var connected = false;
        var commandBuffer = [];
        var md5Hash;

        network.link(node);
        node.on("close", function() {
            
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
                        if(state === true) {
                            node.status({fill:"green",shape:"dot",text:"Sent!"});
                        }
                        else if(state === false) {
                            RED.log.error("Failed To Send Command");
                            node.status({fill:"red",shape:"dot",text:"Failed To Send"});
                        }
                        else {
                            // var msg = { Not needed?
                            //     "topic":"response",
                            //     "payload":state
                            // }
                            // node.send(msg);
                            node.status({fill:"green",shape:"dot",text:"Got Response"});
                        }
                    }

                    node.status({fill:"yellow",shape:"dot",text:"Sending..."});
                    if(msg.topic == "raw") {
                        sendOutCommand(network.server, network.deviceId, msg.payload.type, msg.payload.func, msg.payload.param, callback);
                    }
                    else {
                        sendOutCommand(network.server, network.deviceId, msg.payload.type, commands.getFunction(msg.payload.func), commands.getParameter(msg.payload.func, msg.payload.param), callback);
                    }
                }
            }
        });
    }
    RED.nodes.registerType("kramer-kramer", Kramer);
}



//Send out a raw command
function sendOutCommand(server, deviceId, type, func, param, callback) {
    var sent = false;
    var returnedValue = undefined;
    if(type == "set"){type="0";}
    else if(type == "get"){type="1";}
    if(param == "" || param == undefined || param == null) {
        var sendOutString = "#y " + type + "," + func;
        var sendOutCheckString = "#" + deviceId + "@Y " + type + "," + func;
    }
    else {
        var sendOutString = "#y " + type + "," + func + "," + param;
        var sendOutCheckString = "#" + deviceId + "@Y " + type + "," + func + "," + param;
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
                    if(message.toString().substr(1).includes(sendOutCheckString.substr(1)) && message.toString().includes("OK")) {
                        return true;
                    }
                }
                else if(type == "1"){ 
                    if(message.toString().substr(1).includes(sendOutCheckString.substr(1))) {
                        returnedValue = message.toString().substr(sendOutCheckString.length + 1);
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
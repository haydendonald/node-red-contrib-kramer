module.exports = {
    //Return a function code
    getFunction: function(func) {
        switch(func.toLowerCase()) {
            case "display mode": return "110";
            case "input source": return "120";
            case "input volume": return "211";
            case "output volume": return "212";
            case "mic1 volume": return "213";
            case "mic2 volume": return "214";
            case "mic1 mix": return "253";
            case "mic2 mix": return "255";
            case "line mix": return "254";
            case "mic1 mute": return "7451";
            case "mic2 mute": return "7461";
            case "lineMix mute": return "2541";
            case "output mute": return "7431";
        }
    },

    //Get a parameter for a function
    getParameter: function(func, parameter) {
        switch(func.toLowerCase()) {
            case "display mode": {
                switch(parameter) {
                    case "single window": return "0";
                    case "picture in picture": return "1";
                    case "picture + picture": return "2";
                    case "split": return "3";
                    case "customized": return "4";
                }
            }
            case "input source": {
                switch(parameter) {
                    case "hdmi1": return "13";
                    case "hdmi2": return "14";
                    case "hdmi3": return "10";
                    case "hdmi4": return "15";
                    case "pc1": return "11";
                    case "pc2": return "12";
                    case "cv": return "9";
                    case "dp": return "16";
                    case "sdi": return "17";   
                }
            }
            case "input volume": {
                return parameter;
            }
            case "output volume": {
                return parameter;
            }
            case "mic1 volume": {
                return parameter;
            }
            case "mic2 volume": {
                return parameter;
            }
            case "mic1 mute": {
                return parameter;
            }
            case "mic2 mute": {
                return parameter;
            }
            case "output mute": {
                return parameter;
            }
        }
    },

    findFunction: function findFunction(rawMessage, deviceId) {
        if(rawMessage[0] != 0x7E){return undefined;}
        if(rawMessage.toString().substr(1, 2) !== deviceId){return undefined;}
        if(rawMessage[3] != 0x40){return undefined;}
        if(rawMessage[4] != 0x59 && rawMessage[4] != 0x79){return undefined;}

        var type;
        var func;
        var param;

        //Type
        switch(rawMessage.toString().substr(6,1)) {
            case "0": type="set"; break;
            case "1": type="get"; break;
            default: type=rawMessage.toString().substr(6,1);
        }


        var firstIndex = 0;
        var lastIndex = 0;
        var lasstIndex = 0;
        for(var i = 0; i < rawMessage.toString().length; i++) {
            if(rawMessage.toString()[i] == ",") {
                if(firstIndex == 0) {
                    firstIndex = i;
                }
                else if(lastIndex == 0) {
                    lastIndex = i - firstIndex;
                    lasstIndex = i;
                }
            }
        }

        var functionCode = rawMessage.toString().substr(firstIndex + 1, lastIndex - 1);

        
        firstIndex = 0;
        lastIndex = 0;
        for(var i = lasstIndex; i < rawMessage.toString().length; i++) {
            if(rawMessage.toString()[i] == "," || rawMessage[i] == 0x0D) {
                if(firstIndex == 0) {
                    firstIndex = i;
                }
                else if(lastIndex == 0) {
                    lastIndex = i - firstIndex;
                }
            }
        }

        var parameterCode = rawMessage.toString().substr(firstIndex + 1, lastIndex - 1);
        switch(functionCode) {
            case "110": {
                func="display mode"; 
                switch(parameterCode) {
                    case "0": param="single window"; break;
                    case "1": param="picture in picture"; break;
                    case "2": param="split"; break;
                    case "3": param="customized"; break;
                    default: param = parameterCode;
                }
                break;
            }
            case "120": {
                func="input source";
                switch(parameterCode) {
                    case "13": param="hdmi1"; break;
                    case "14": param="hdmi2"; break;
                    case "10": param="hdmi3"; break;
                    case "15": param="hdmi4"; break;
                    case "11": param="pc1"; break;
                    case "12": param="pc2"; break;
                    case "9": param="cv"; break;
                    case "16": param="dp"; break;
                    case "17": param="sdi1"; break;
                    default: param = parameterCode;
                }
                break;
            }
            case "211": {
                func="input volume";
                param = parameterCode;
                break;
            }
            case "212": {
                func="output volume"; 
                param = parameterCode;
                break;
            }
            case "213": {
                func="mic1 volume"; 
                param = parameterCode;
                break;
            }
            case "214": {
                func="mic2 volume";
                param = parameterCode;
                break;
            }
            case "253": {
                func="mic1 mix"; 
                param = parameterCode;
                break;
            }
            case "255": {
                func="mic2 mix"; 
                param = parameterCode;
                break;
            }
            case "254": {
                func="line mix"; 
                param = parameterCode;
                break;
            }
            case "7451": {
                func="mic1 mute";
                param = parameterCode;
                break;
            }
            case "7461": {
                func="mic2 mute";
                param = parameterCode;
                break;
            }
            case "2541": {
                func="lineMix mute";
                param = parameterCode;
                break;
                
            }
            case "7431": {
                func="output mute";
                param = parameterCode;
                break;
            }
            default: func = functionCode; param=parameterCode;
        }

        return {
            "type":type,
            "func":func,
            "param":param
        };
    }
}
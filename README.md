# node-red-contrib-kramer
Kramer Control for Node Red
Tested Using the VP-774A

# In Development Not Ready For Use!


#Required MSG Object (Will also be the same on the output unless msg.topic is response in which case the msg.payload will be the response)
msg.payload.type* - The type of command to be set, can either be "set" or "get"
msg.payload.func* - The function to be processed, look below at the supported functions, can also be sent the raw command ID found in the offical documentation
msg.payload.param* - The parameters for the function, look below for the supported parameters, can also be sent the raw command ID found in the offical documentation

(* = required)

#List of Supported Commands
##msg.payload.func = 
##Display Mode
msg.payload.param = 
Single Window
Picture In Picture
Picture + Picture
Split
Customized
##Input Source
msg.payload.param =
hdmi1
hdmi2
hdmi3
hdmi4
pc1
pc2
vc
dp
sdi
##Input Volume
msg.payload.param = volume level (-20 -> 4) [dB]
##Output Volume
msg.payload.param = volume level (-80 -> 20) [dB]
##Mic1 Volume
msg.payload.param = volume level (-100 -> 12) [dB]
##Mic2 Volume
msg.payload.param = volume level (-100 -> 12) [dB]
##Mic1 Mix
msg.payload.param = volume level (-100 -> 1) [dB]
##Mix2 Mix
msg.payload.param = volume level (-100 -> 1) [dB]
##Line Mix
msg.payload.param = volume level (-100 -> 0) [dB]
"use strict";

const Serializer= require('./../serialize/Serializer');

const NetworkedEventFactory = require('./NetworkedEventFactory');
const NetworkedEventCollection = require('./NetworkedEventCollection');
const Utils = require('./../Utils');

class NetworkTransmitter{

    constructor(serializer){
        this.serializer = serializer;

        this.registeredEvents=[];

        this.payload = [];

        this.serializer.registerClass(NetworkedEventCollection);

        this.registerNetworkedEventFactory("objectUpdate", {
            netScheme: {
                stepCount: { type: Serializer.TYPES.INT32 },
                objectInstance: { type: Serializer.TYPES.CLASSINSTANCE }
            }
        });

        this.registerNetworkedEventFactory("objectCreate", {
            netScheme: {
                stepCount: { type: Serializer.TYPES.INT32 },
                id: { type: Serializer.TYPES.UINT8 },
                x: { type: Serializer.TYPES.INT16 },
                y: { type: Serializer.TYPES.INT16 }
            }
        });

        this.registerNetworkedEventFactory("objectDestroy", {
            netScheme: {
                stepCount: { type: Serializer.TYPES.INT32 },
                id: { type: Serializer.TYPES.UINT8 }
            }
        });
    }


    registerNetworkedEventFactory(eventName, options){
        options = Object.assign({}, options);

        let classHash = Utils.hashStr(eventName);

        let networkedEventPrototype = function(){};
        networkedEventPrototype.prototype.classId = classHash;
        networkedEventPrototype.prototype.eventName = eventName;
        networkedEventPrototype.netScheme = options.netScheme;

        this.serializer.registerClass(networkedEventPrototype, classHash);

        this.registeredEvents[eventName] = new NetworkedEventFactory(this.serializer, eventName, options);
    }

    addNetworkedEvent(eventName, payload){
        if (this.registeredEvents[eventName]) {

            let stagedNetworkedEvent = this.registeredEvents[eventName].create(payload);
            this.payload.push(stagedNetworkedEvent);

            return stagedNetworkedEvent;
        }
        else{
            console.error(`NetworkTransmitter: no such event ${eventName}`);
        }
    }

    serializePayload(options){
        let networkedEventCollection = new NetworkedEventCollection(this.payload);
        let dataBuffer = networkedEventCollection.serialize(this.serializer);

        // reset payload
        if (options.resetPayload) {
            this.payload = [];
        }

        return dataBuffer;
    }

    deserializePayload(payload){
        return this.serializer.deserialize(payload.dataBuffer).obj;
    }

    clearPayload(){
        this.payload = [];
    }

}

module.exports = NetworkTransmitter;

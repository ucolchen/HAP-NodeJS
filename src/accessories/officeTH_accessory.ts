// here's a fake temperature sensor device that we'll expose to HomeKit
import { Accessory, Categories, Characteristic, CharacteristicEventTypes, CharacteristicValue, NodeCallback, Service, uuid } from '..';

const location='office';
const MQTT_SENSOR = {

  currentTemperature: 7,
  getTemperature: function () {
    //console.log(location+ ' temperature: %s',MQTT_SENSOR.currentTemperature.toString());
    //console.log("Getting the current temperature!");
    return MQTT_SENSOR.currentTemperature;
  },  
  
  CurrentRelativeHumidity: 77,
  getHumidity: function () {
    //console.log(location+ ' humidity: %s',MQTT_SENSOR.CurrentRelativeHumidity.toString());
    //console.log("Getting the current RelativeHumidity!");
    return MQTT_SENSOR.CurrentRelativeHumidity;
  }
 };

// MQTT Setup
var mqtt = require('mqtt');
console.log("Connecting to MQTT broker...");
var client = mqtt.connect('mqtt://192.168.1.200');
client.on('connect', function () {
  client.subscribe('sensors/'+location, function (err: any) {
    if (err) {
      console.log("failed to subscribe to MQTT broker")
    }
    else {
      console.log("Sensor subscribed to MQTT broker")
    }
  })
})

client.on('message', function(topic: any, message: any) {
  // message is Buffer 
  var data = JSON.parse(message);
  console.log(location+ ' temperature: %s',data.temperature.toString());
  console.log(location+ ' humidity: %s',data.humidity.toString());
  MQTT_SENSOR.currentTemperature = data.temperature;
  MQTT_SENSOR.CurrentRelativeHumidity = data.humidity;
});

// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".
const sensorUUID = uuid.generate('hap-nodejs:accessories:sensor'+location);

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake lock.
const sensor = exports.accessory = new Accessory(location+' TH Sensor', sensorUUID);
// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
// @ts-ignore
sensor.username = "C1:5D:3A:AE:5E:FA";
// @ts-ignore
sensor.pincode = "031-45-154";
// @ts-ignore
sensor.category = Categories.SENSOR;

// Add the actual TemperatureSensor Service.
sensor
  .addService(Service.TemperatureSensor)!
  .getCharacteristic(Characteristic.CurrentTemperature)!
  .on(CharacteristicEventTypes.GET, (callback: NodeCallback<CharacteristicValue>) => {

    // return our current value
    callback(null, MQTT_SENSOR.getTemperature());
  });
  
// Add the Humidity Service
sensor
  .addService(Service.HumiditySensor)
  .getCharacteristic(Characteristic.CurrentRelativeHumidity)
  .on('get', function(callback) {

    // return our current value
    callback(null, MQTT_SENSOR.getHumidity());
  });

// randomize our temperature reading every 3 seconds
setInterval(function() {

  // update the characteristic value so interested iOS devices can get notified
  sensor
    .getService(Service.TemperatureSensor)!
    .setCharacteristic(Characteristic.CurrentTemperature, MQTT_SENSOR.currentTemperature);

  // update the characteristic value so interested iOS devices can get notified
  sensor
    .getService(Service.HumiditySensor)!
    .setCharacteristic(Characteristic.CurrentRelativeHumidity, MQTT_SENSOR.CurrentRelativeHumidity);

}, 1000);

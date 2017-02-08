'use strict';

const PROTO_PATH = 'messages.proto';

const fs = require('fs');
const grpc = require('grpc');

const serviceDef = grpc.load(PROTO_PATH);
const employees = require('./employees').employees;
const PORT = 9000;

 // normally you would generate your own certificates and register your credentials with grpc
 //
const server = new grpc.Server();
server.addProtoService(serviceDef.EmployeeService.service, {
  getByBadgeNumber: getByBadgeNumber,
  getAll: getAll,
  addPhoto: addPhoto,
  saveAll: saveAll,
  save: save
});

// we choose to use insecure connection here. If we have certificate credentials we would have used them instead
server.bind( `0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure());
console.log('Starting grpc server');
server.start();
console.log(`gRPC Server started on ${PORT}...`);

function getByBadgeNumber(call, callback) {
  const md = call.metadata.getMap();
  for (let key in md) {
    console.log(key, md[key]);
  }

  const badgeNumber = call.request.badgeNumber;
  const employee = employees.find(employee => employee.badgeNumber === badgeNumber);
  if (employee) {
    return callback(null, { employee });
  }

  callback('Seems no Employee with that badge number exists');
}

function getAll(call) {
  // to stream a response back to the client
  console.log('Server method called');
  employees.forEach(employee => call.write({ employee }));
  call.end();
}

function addPhoto(call, callback) {
  // handling client side streaming
  let result = new Buffer(0);
  call.on('data', (data) => {
    result = Buffer.concat([result, data.data]);
    console.log(`Message recieved with size ${data.data.length}`);
  });
  // we assign a function to the end event that will be triggered once we are done receiving the request
  call.on('end', ()=> {
    callback(null, { isOk: true });
    console.log(`Total file size: ${result.length} bytes`);
  });
}

function saveAll(call) {
  //write back the data to the client once it has been received
  call.on('data', (emp) => {
    employees.push(emp.employee);
    call.write({ employee: emp.employee });
  });

  //log all the data you have to confirm that the new ones were added to the collection
  call.on('end', () => {
    employees.forEach(employee => {
      console.log(employee);
    });
    // close the response stream
    call.end();
  });
}

function save(call, callback) {
  //code here
}
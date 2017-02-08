'use strict';

const PROTO_PATH = 'messages.proto';
const PORT = 9000;

const fs = require('fs');
const process = require('process');
const grpc = require('grpc');

const serviceDef = grpc.load(PROTO_PATH);
const client = new serviceDef.EmployeeService('localhost:9000', grpc.credentials.createInsecure());

const option = parseInt(process.argv[2], 10);

switch(option) {
  case 1:
    sendMetaData(client);
    break;
  case 2:
    getByBadgeNumber(client);
    break;
  case 3:
    getAll(client);
    break;
  case 4:
    addPhoto(client);
    break;
  case 5:
    saveAll(client);
    break;
}

function saveAll(client) {
  const employees = [
    {
      badgeNumber: 123,
      firstName: 'John',
      lastName: 'Smith',
      vacationAccrualRate: 1.2,
      vacationAccrued: 0
    },
    {
      badgeNumber: 234,
      firstName: 'Lisa',
      lastName: 'Wu',
      vacationAccrualRate: 1.7,
      vacationAccrued: 10
    }
  ];
  // initiate server response first so that you don't loose any message sent to the server
  const call = client.saveAll();
  call.on('data', (data) => console.log(data.employee));
  employees.forEach(employee => call.write({ employee }));
  // end the communication to the server. The server will close things up when its done
  call.end();
}

function addPhoto(client) {
  const md = new grpc.Metadata();
  md.add('badgenumber', '2080');
  const call = client.addPhoto(md, (err, result) => {
    console.log(result);
  });

  const stream = fs.createReadStream('itachi.jpg');
  stream.on('data', (chunk) => call.write({ data: chunk }));
  stream.on('end', () => call.end());
}

function getAll(client) {
  const call = client.getAll({});
  console.log('call made, expecting result')
  call.on('data', (data) => {
    console.log(data.employee);
  });
}

function sendMetaData(client) {
  const md = new grpc.Metadata();
  md.add('username', 'Baba');
  md.add('password', 'password1');

  client.getByBadgeNumber({}, md, () => {});
}

function getByBadgeNumber(client) {
  client.getByBadgeNumber({ badgeNumber: 2080}, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log(res.employee);
    }
  });
}
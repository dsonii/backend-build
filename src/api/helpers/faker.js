const faker = require('faker');
const Driver = require('../models/driver.model');


module.exports = {

  seedDrivers: async (password) => {
    const arrdriver = [];
    for (let i = 0; i <= 50; i++) {
      const newDriver = new Driver();
      newDriver.adminId = '6090a7f9e02390259c1bee0b';
      newDriver.email = faker.internet.email();
      newDriver.firstname = faker.name.firstName();
      newDriver.lastname = faker.name.lastName();
      newDriver.phone = faker.phone.phoneNumber('0999#######');
      newDriver.document_licence = '';
      newDriver.document_adhar_card = '';
      newDriver.document_police_vertification = '';
      arrdriver.push(newDriver);
    }

    await Driver.insertMany(arrdriver);
    return arrdriver;
  },
  // seedAgents: async (password) => {
  //   const arragent = [];
  //   for (let i = 0; i <= 50; i++) {
  //     const newAgent = new Agent();
  //     newAgent.email = faker.internet.email();
  //     newAgent.firstname = faker.name.firstName();
  //     newAgent.lastname = faker.name.lastName();
  //     newAgent.phone = faker.phone.phoneNumber('0988#######');
  //     newAgent.password = newAgent.encryptPassword(password);
  //     newAgent.company = faker.company.companyName();
  //     newAgent.address1 = faker.address.streetAddress();
  //     newAgent.address2 = faker.address.secondaryAddress();
  //     newAgent.city = faker.address.city();
  //     newAgent.pincode = faker.address.zipCode();
  //     arragent.push(newAgent);
  //   }

  //   await Agent.insertMany(arragent);
  //   return arragent;
  // },

};

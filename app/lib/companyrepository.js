'use strict';

const sectors = require('../../data/sectors.json');
const contactsData = require('../../data/fakenames.json');
const statusOptions = ['Prospect', 'UKTI Customer', ''];
const api = require('../lib/companieshouseapis');
const sicCodes = require('../../data/sic-codes.json');
const interactionsData = require('../../data/interactions.json');

let data = {};

function expandSicCodes(company) {
  if (company.sic_codes) {
    const expandedCodes = company.sic_codes.map((sic_code) => {
      return sicLookup(sic_code);
    });

    delete company.sic_codes;
    company.sic_codes = expandedCodes;
  }
}

function sicLookup(code) {
  let sicCode = sicCodes.find((item) => {
    return item.code === code;
  });

  if (!sicCode) {
    return code;
  }
  return sicCode;
}

function addSectors(company) {
  company.sectors = [];
  for (let pos = Math.round(Math.random() * 3); pos > 0; pos -= 1) {
    company.sectors.push(sectors[Math.round(Math.random() * (sectors.length - 1))]);
  }
}

function addStatus(company) {
  const randindex = Math.round(Math.random() * (statusOptions.length - 1));
  company.uktiStatus = statusOptions[randindex];

}

function addRandomPeople(company) {
  company.contacts = [];
  for (let pos = 5; pos > 0; pos -= 1) {
    const randindex = Math.round(Math.random() * (contactsData.length - 1));
    let randomContact = Object.assign({}, contactsData[randindex]);
    randomContact.name = `${randomContact.givenname} ${randomContact.surname}`;
    delete randomContact.surname;
    delete randomContact.givenname;
    randomContact.id = `${pos}${company.id}`;
    company.contacts.push(randomContact);
  }
  company.contacts[0].primaryContact = true;
}

function getCompanySummary(id) {
  return data[id];
}

function getCompany(id) {
  return new Promise((fulfill, reject) => {

    // Look for the company in local cached data,
    // if not there then created an empty one to populate
    let company = data[id];
    if (!company) {
      company = {
        company_number: id,
        id: id
      };
    }

    // if the cached record is a detailed one, return it
    if (company.containsExpandedData) {
      fulfill(company);
      return;
    }

    // If the cachced record isn't complete, goto CH API and get it's details
    api.findCompany(id)
      .then((chCompany) => {

        Object.assign(company, chCompany);
        company.containsExpandedData = true;
        expandSicCodes(company);

        // Add it back into the local DB. it will override the existing one
        // and add the contacts and stuff if we had to get a fresh copy
        // because of a restart
        company = addCompany(company);

        fulfill(company);
      })
      .catch((error) => {
        reject(error);
      });


  });
}

function addUKTIData(company) {
  addRandomPeople(company);
  addSectors(company);
  addStatus(company);

  Object.assign(company, {
    countryOfInterest: ['Argentina', 'Greece'],
    interactions: interactionsData.slice(0),
    uktidata: true
  });
}

function addCompany(company) {
  if (!company.id && company.company_number) {
    company.id = company.company_number;
  }
  if (!company.uktidata) {
    addUKTIData(company);
  }
  data[company.id] = company;
  return company;
}

function updateCompany(company) {
  data[company.id] = company;
}

function getCompanyContact(companyId, contactId) {

  const company = data[companyId];
  if (!company) {
    return null;
  }

  let contacts = company.contacts;
  for (let pos = 0; pos < contacts.length; pos += 1) {
    if (contacts[pos].id === contactId) {
      let contact = contacts[pos];
      contact.company = {
        title: company.title,
        id: company.id
      };
      contact.sectors = company.sectors;
      contact.uktiStatus = company.uktiStatus;
      contact.interactions = company.interactions;
      return contact;
    }
  }

  return null;
}

function setCompanyContact(companyId, updatedContact) {

  const company = data[companyId];
  if (!company) {
    return null;
  }

  // Add new contacts, that have no id
  if (!updatedContact.id) {
    updatedContact.id = `${company.contacts.length + 1}${company.id}`;
    updatedContact.company = {
      title: company.title,
      id: company.id
    };
    company.contacts.push(updatedContact);
    return updatedContact;
  }

  // Update contacts that exist
  let contacts = company.contacts;
  for (let pos = 0; pos < contacts.length; pos += 1) {
    if (contacts[pos].id === updatedContact.id) {
      company.contacts[pos] = updatedContact;
      return company.contacts[pos];
    }
  }

  return null;
}

module.exports = {
  getCompany,
  getCompanySummary,
  addCompany,
  updateCompany,
  getCompanyContact,
  setCompanyContact
};

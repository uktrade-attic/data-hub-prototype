'use strict';

const React = require('react');
const axios = require('axios');
const BaseForm = require('./baseform');
const SelectWithId = require('../components/selectwithid.component');
const Address = require('../components/address.component');
const Autosuggest = require('../components/autosuggest.component');
const InputText = require('../components/inputtext.component');
const ErrorList = require('../components/errorlist.component');
const DidYouMeanCompany = require('../components/didyoumeancompany.component');
const Radio = require('../components/radio.component');


const LABELS = {
  'name': 'Registered name',
  'uk_based': 'Is the business based in the UK?',
  'business_type': 'Type of business',
  'sector': 'Sector',
  'registered_address': 'Registered address',
  'uk_region': 'Region',
  'alias': 'Trading name (optional)',
  'trading_address': 'Trading address (optional)',
  'website': 'Website (optional)',
  'description': 'Business description (optional)',
  'employee_range': 'Number of employees (optional)',
  'turnover_range': 'Annual turnover (optional)',
  'account_manager': 'Account manager',
  'export_to_countries': 'Export market',
  'future_interest_countries': 'Future countries of interest (optional)',
  'lead': 'Is this company a lead?'
};

const defaultCompany = {
  name: '',
  uk_based: true,
  business_type: {
    id: null,
    name: null
  },
  sector: {
    id: null,
    name: null
  },
  uk_region: {
    id: null,
    name: null
  },
  registered_address: {
    address_1: '',
    address_2: '',
    address_town: '',
    address_county: '',
    address_postcode: '',
    address_country: {
      id: null,
      name: ''
    }
  },
  alias: '',
  trading_address: {
    address_1: '',
    address_2: '',
    address_town: '',
    address_county: '',
    address_postcode: '',
    address_country: {
      id: null,
      name: ''
    }
  },
  website: '',
  description: '',
  employee_range: {
    id: null,
    name: ''
  },
  turnover_range: {
    id: null,
    name: ''
  },
  account_manager: {
    id: null,
    name: ''
  },
  export_to_countries: [
    {id: null, name: ''}
  ],
  future_interest_countries: [
    {id: null, name: ''}
  ],
  lead: false
};

class CompanyForm extends BaseForm {

  constructor(props) {
    super(props);

    let company;
    if (props.company) {
      company = Object.assign({}, props.company);
      this.setDefaults(company, defaultCompany);
    } else {
      company = Object.assign({}, defaultCompany);
    }

    this.state = {
      countryOptions: [],
      businessTypes: [],
      show_account_manager: (company.account_manager.id !== null),
      show_exporting_to: (company.export_to_countries[0].id !== null),
      saving: false,
      canceling: false,
      formData: company,
      isCDMS: (!company.company_number || company.company_number.length === 0)
    };

  }

  componentDidMount() {
    axios.get('/api/meta/countries')
      .then(result => {
        this.setState({countryOptions: result.data});
      });
    axios.get('/api/meta/typesofbusiness')
      .then(result => {
        this.setTypesOfBusiness(result.data);
      });
  }

  setTypesOfBusiness(types) {
    // Record ALL types of business and a stripped down UK types of business
    // So we can change the drop down list depending on if set to UK or not.
    this.allBusinessTypes = types;
    this.ukBusinessTypes = types.filter((businessType) =>
      !(businessType.name.toLowerCase() === 'private limited company' || businessType.name.toLowerCase() === 'public limited company'));

    console.log(this.state.formData.uk_based);

    if (this.state.formData.uk_based) {
      this.setState({businessTypes: this.ukBusinessTypes});
    } else {
      this.setState({businessTypes: this.allBusinessTypes});
    }
  }

  updateExpandingSection = (event) => {
    const key = event.target.name;
    let value;

    if (event.target.value.toLocaleLowerCase() === 'yes') {
      value = true;
    } else if (event.target.value.toLocaleLowerCase() === 'no') {
      value = false;
    } else {
      value = event.target.value;
    }
    this.setState({[key]: value});
  };

  updateExportingTo = (newValue, index) => {
    let exportToCountries = this.state.formData.export_to_countries;
    exportToCountries[index] = newValue.value;
    this.changeFormData('export_to_countries', exportToCountries);
  };

  updateFutureExportTo = (newValue, index) => {
    let futureCountries = this.state.formData.future_interest_countries;
    futureCountries[index] = newValue.value;
    this.changeFormData('future_interest_countries', futureCountries);
  };

  addCurrentExportCountry = (event) => {
    event.preventDefault();
    let currentExportCountries = this.state.formData.export_to_countries;
    currentExportCountries.push({ id: null, name: '' });
    this.changeFormData('export_to_countries', currentExportCountries);
  };

  addFutureExportCountry = (event) => {
    event.preventDefault();
    let futureExportCountries = this.state.formData.future_interest_countries;
    futureExportCountries.push({ id: null, name: '' });
    this.changeFormData('future_interest_countries', futureExportCountries);
  };

  updateUkBased = (event) => {
    this.updateField(event);

    if (event.target.value === 'Yes') {
      // If this is a uk business restrict the business types to choose from
      // and reset the current business type if it is not allowed

      this.setState({businessTypes: this.ukBusinessTypes});
      const lowerCurrentType = this.state.formData.business_type.name.toLowerCase();

      if (lowerCurrentType === 'private limited company' || lowerCurrentType === 'public limited company') {
        this.setState({business_type: defaultCompany.business_type});
      }
    } else {
      this.setState({businessTypes: this.allBusinessTypes});
    }
  }

  getCurrentlyExportingTo() {
    return this.state.formData.export_to_countries.map((country, index) => {
      let label;

      if (index === 0) {
        label = 'Export market';
      } else {
        label = null;
      }

      return (
        <Autosuggest
          key={index}
          name="export_to_countries"
          label={label}
          value={country}
          options={this.state.countryOptions}
          onChange={(countryUpdate) => {
            this.updateExportingTo(countryUpdate, index);
          }}
        />
      );
    });
  }

  getFutureCountriesOfInterest() {
    return this.state.formData.future_interest_countries.map((country, index) => {
      let label;

      if (index === 0) {
        label = 'Future countries of interest (optional)';
      } else {
        label = null;
      }

      return (
        <Autosuggest
          key={index}
          name="future_interest_countries"
          label={label}
          value={country}
          options={this.state.countryOptions}
          onChange={(countryUpdate) => {
            this.updateFutureExportTo(countryUpdate, index);
          }}
        />
      );
    });
  }

  save = () => {
    // Just post the company and let the server do the rest. (Get it.. REST)
    this.setState({saving: true});
    axios.post('/company/', { company: this.state.formData })
      .then((response) => {
        window.location.href = `/company/combined/${response.data.id}`;
      })
      .catch((error) => {
        this.setState({
          errors: error.response.data.errors,
          saving: false
        });
      });
  };

  cancel = () => {
    this.setState({cancelling: true});
    window.location.reload();
  };

  render() {
    if (this.state.cancelling) {
      return (
        <div className="saving">Cancelling...</div>
      );
    }

    if (this.state.saving) {
      return this.getSaving();
    }

    const formData = this.state.formData;

    return (
      <div>

        { this.state.errors &&
          <ErrorList labels={LABELS} errors={this.state.errors}/>
        }

        { this.state.isCDMS &&
          <div>
            { formData.id ?
              <InputText
                label={LABELS.name}
                name="name"
                value={formData.name}
                errors={this.getErrors('name')}
                onChange={this.updateField}
              />
              :
              <DidYouMeanCompany
                name="name"
                label={LABELS.name}
                onChange={this.updateField}
                errors={this.getErrors('name')}
                value={formData.name}
              />
            }
            <fieldset className="inline form-group form-group__checkbox-group form-group__radiohide">
              <legend className="form-label">Is the business based in the UK?</legend>
              <Radio
                name="uk_based"
                label="Yes"
                value="Yes"
                checked={formData.uk_based}
                onChange={this.updateUkBased}
              />
              <Radio
                name="uk_based"
                label="No"
                value="No"
                checked={!formData.uk_based}
                onChange={this.updateUkBased}
              />
              { formData.uk_based &&
                <p className="js-radiohide-content">
                You can add any type of company except UK based private and public limited
                companies. These companies are already on data hub as it uses companies
                house data. Please search for these companies first on data hub to add or
                edit their details.
                </p>
              }
            </fieldset>
            <SelectWithId
              value={formData.business_type.id || null}
              options={this.state.businessTypes}
              name="business_type"
              label="Type of business"
              errors={this.getErrors('business_type')}
              onChange={this.updateField}
            />
          </div>
        }

        <SelectWithId
          value={formData.sector.id}
          url="/api/meta/sector"
          name="sector"
          label="Sector"
          errors={this.getErrors('sector')}
          onChange={this.updateField}
        />
        { this.state.isCDMS &&
          <Address
            name='registered_address'
            label='Registered address'
            onChange={this.updateField}
            errors={this.getErrors('registered_address')}
            value={formData.registered_address}
          />
        }
        { (formData.uk_based || formData.company_number && formData.company_number.length > 0) &&
          <SelectWithId
            value={formData.uk_region.id}
            url="/api/meta/region"
            name="uk_region"
            label="Region"
            errors={this.getErrors('uk_region')}
            onChange={this.updateField}
          />
        }
        <hr/>
        <InputText
          label={LABELS.alias}
          name="alias"
          value={formData.alias}
          errors={this.getErrors('alias')}
          onChange={this.updateField}
        />
        <Address
          name='trading_address'
          label='Trading address'
          errors={this.getErrors('trading_address')}
          onChange={this.updateField}
          value={formData.trading_address}
        />
        <InputText
          label={LABELS.website}
          name="website"
          errors={this.getErrors('website')}
          value={formData.website}
          onChange={this.updateField}
        />
        <div className="form-group ">
          <label className="form-label" htmlFor="description">Business description (optional)</label>
          <textarea
            id="description"
            className="form-control"
            name="description"
            rows="5"
            onChange={this.updateField}
            value={formData.description}/>
        </div>
        <SelectWithId
          value={formData.employee_range.id}
          url="/api/meta/employee_range"
          name="employee_range"
          errors={this.getErrors('employee_range')}
          label="Number of employees (optional)"
          onChange={this.updateField}
        />
        <SelectWithId
          value={formData.turnover_range.id}
          url="/api/meta/turnover_range"
          name="turnover_range"
          errors={this.getErrors('turnover_range')}
          label="Annual turnover (optional)"
          onChange={this.updateField}
        />
        <fieldset className="inline form-group form-group__checkbox-group form-group__radiohide">
          <legend className="form-label">Is there an agreed DIT account manager for this company?</legend>
          <Radio
            name="show_account_manager"
            label="Yes"
            value="Yes"
            checked={this.state.show_account_manager}
            onChange={this.updateExpandingSection}
          />
          <Radio
            name="show_account_manager"
            label="No"
            value="No"
            checked={!this.state.show_account_manager}
            onChange={this.updateExpandingSection}
          />

          { this.state.show_account_manager &&
          <div className="js-radiohide-content">
            <Autosuggest
              name="account_manager"
              label='Account manager'
              value={formData.account_manager}
              lookupUrl='/api/accountmanagerlookup'
              onChange={this.updateField}
              errors={this.getErrors('account_manager')}
            />
          </div>
          }
        </fieldset>
        <fieldset className="inline form-group form-group__checkbox-group form-group__radiohide">
          <legend className="form-label">{LABELS.lead}</legend>
          <Radio
            name="lead"
            label="Yes"
            value="Yes"
            checked={formData.lead}
            onChange={this.updateField}
          />
          <Radio
            name="lead"
            label="No"
            value="No"
            checked={!formData.lead}
            onChange={this.updateField}
          />

        </fieldset>
        <fieldset className="inline form-group form-group__checkbox-group form-group__radiohide">
          <legend className="form-label">Is this company currently exporting to a market?</legend>
          <Radio
            name="show_exporting_to"
            label="Yes"
            value="Yes"
            checked={this.state.show_exporting_to}
            onChange={this.updateExpandingSection}
          />
          <Radio
            name="show_exporting_to"
            label="No"
            value="No"
            checked={!this.state.show_exporting_to}
            onChange={this.updateExpandingSection}
          />
          { this.state.show_exporting_to &&
          <div className="js-radiohide-content">
            { this.getCurrentlyExportingTo() }
            <a className="add-another-button" onClick={this.addCurrentExportCountry}>
              Add another country
            </a>

          </div>
          }
        </fieldset>

        {this.getFutureCountriesOfInterest()}
        <a className="add-another-button" onClick={this.addFutureExportCountry}>
          Add another country
        </a>

        <div className="button-bar">
          <button className="button button--save" type="button" onClick={this.save}>Save</button>
          <a className="button-link button--cancel js-button-cancel" href="#" onClick={this.cancel}>Cancel</a>
        </div>
      </div>
    );
  }

  static propTypes = {
    company: React.PropTypes.object
  };

}

module.exports = CompanyForm;

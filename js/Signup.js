'use strict';

var React = require('react');
var content = require('./content');
var RawHTML = require('./RawHTML');
var $ = require('jquery');
var config  = require('./config')
var {Grid, Row, Col, Button} = require('react-bootstrap');
var {Navigation} = require('react-router');

var AFFILIATION = [
    ["I am a Clinical Lab Director",        "Clinical Lab Director"],
    ["I am a member of a diagnostic lab",   "Diagnostic Lab Staff"],
    ["I lead a principal investigator",     "Principal Investigator"],
    ["I am a researcher",                   "Researcher"],
    ["I lead an advocacy group",            "Advocacy Group Leader"],
    ["I am a member of an advocacy group",  "Advocacy Group Member"],
    ["I am a genetic counselor",            "Genetic Counselor"],
    ["I am a clinical geneticist",          "Clinical Geneticist"],
    "I am a clinician",
    "Other"
];

AFFILIATION.has = function(affil) {
    return this.slice(0, -2).some(val => affil === (val instanceof Array ? val[1] : val));
}

var Signup = React.createClass({
    mixins: [Navigation],
    getInitialState: function () {
        return {
            submitted: null,
            success: null
        }
    },
    render: function () {
        var message;
        if (this.state.error != null) {
            message = <div className="alert alert-danger">
                <p>{this.state.error}</p>
            </div>
        }
        return (
            <Grid id="main-grid">
                <Row>
                    <Col sm={10} smOffset={1}  className="alert alert-warning">
                        <RawHTML ref='content' html={content.pages.signupMessage}/>
                    </Col>
                </Row>
                <Row id="message">
                    {message}
                </Row>
                <Row id="form">
                    <Col md={8} mdOffset={2}>
                        <SignupForm ref="contactForm"/>
                    </Col>
                </Row>
                <Row id="submit">
                    <Col md={6} mdOffset={3}>
                        <Button type="button" className="btn btn-primary btn-block" onClick={this.handleSubmit}>
                            Submit
                        </Button>
                    </Col>
                </Row>
            </Grid>)
    },

    handleChange: function (field, e) {
        var nextState = {};
        nextState[field] = e.target.checked
        this.setState(nextState)
    },

    handleSubmit: function () {
        var showSuccess = () => {this.transitionTo('/community', null, {registrationSuccess:true})};
        var showFailure = (msg => {this.setState({error: msg})});

        if (this.refs.contactForm.isValid()) {
            var formData = this.refs.contactForm.getFormData();
            this.setState({submitted: formData});
            var url = config.backend_url + '/accounts/register/';

            var fd = new FormData();
            $.each(formData, function (k, v) {
                fd.append(k, v);
            });

            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                var responseData = JSON.parse(this.response);

                if (this.status == 200 && responseData.success === true) {
                    showSuccess();
                } else {
                    var message = responseData.error;
                    if (message === null) {
                        message = "Could not complete registration";
                    }
                    showFailure(message)
                }
            };
            xhr.open('post', url);
            xhr.send(fd);
        } else {
            this.setState({error: "Some information was missing"});
        }
    }
});

var SignupForm = React.createClass({
    getInitialState: function () {
        return {errors: {}, file: '', imagePreviewUrl: null, captcha: "", otherAffiliation: false}
    },
    componentDidMount: function() {
        var me = this;
        onRecaptchaLoad(function() {
            grecaptcha.render(me.refs.signupCAPTCHA.getDOMNode(), {sitekey: config.captcha_key, callback: function(resp) {
                me.setState({captcha: resp});
            }});
        });
    },
    isValid: function () {
        var compulsory_fields = ['email', 'email_confirm', 'password', 'password_confirm'];
        var errors = {};
        if (this.refs.email.getDOMNode().value != this.refs.email_confirm.getDOMNode().value) {
            errors["email_confirm"] = "The emails don't match"
        }
        if (this.refs.password.getDOMNode().value != this.refs.password_confirm.getDOMNode().value) {
            errors["password_confirm"] = "The passwords don't match"
        }
        if (this.state.captcha == "") {
            errors["captcha"] = "No CAPTCHA entered"
        }
        compulsory_fields.forEach(function (field) {
            var value = trim(this.refs[field].getDOMNode().value)
            if (!value) {
                errors[field] = 'This field is required'
            }
        }.bind(this));
        this.setState({errors: errors});

        var isValid = true;
        for (var error in errors) {
            isValid = false;
            break;
        }
        
        return isValid
    },
    getFormData: function () {
        var title = this.refs.titlemd.getDOMNode().checked && this.refs.titlemd.getDOMNode().value ||
            this.refs.titlephd.getDOMNode().checked && this.refs.titlephd.getDOMNode().value ||
            this.refs.titleother.getDOMNode().checked && this.refs.titlecustom.getDOMNode().value;

        var data = {
            image: this.state.file
            , email: this.refs.email.getDOMNode().value
            , email_confirm: this.refs.email_confirm.getDOMNode().value
            , password: this.refs.password.getDOMNode().value
            , password_confirm: this.refs.password_confirm.getDOMNode().value
            , firstName: this.refs.firstName.getDOMNode().value
            , lastName: this.refs.lastName.getDOMNode().value
            , title: title
            , affiliation: (this.state.otherAffiliation ? this.refs.other_affiliation : this.refs.affiliation).getDOMNode().value
            , institution: this.refs.institution.getDOMNode().value
            , city: this.refs.city.getDOMNode().value
            , state: this.refs.state.getDOMNode().value
            , country: this.refs.country.getDOMNode().value
            , phone_number: this.refs.phone_number.getDOMNode().value
            , comment: this.refs.comment.getDOMNode().value
            , include_me: this.refs.include_me.getDOMNode().checked
            , email_me: this.refs.email_me.getDOMNode().checked
            , hide_number: this.refs.hide_number.getDOMNode().checked
            , hide_email: this.refs.hide_email.getDOMNode().checked
            , captcha: this.state.captcha
        };
        return data
    },
    handleImageChange(e) {
        e.preventDefault();

        let reader = new FileReader();
        let file = e.target.files[0];
        reader.onloadend = () => {
            if (file.size <= 4 * 1024 * 1024) {
                this.setState({
                    file: file,
                    imagePreviewUrl: reader.result,
                    imageTooBig: false
                });
            } else {
                this.setState({
                    file: null,
                    imagePreviewUrl: null,
                    imageTooBig: true
                });
            }
        };
        reader.readAsDataURL(file)
    },
    render: function () {
        var onChange = function() {
            var value = this.refs.affiliation.getDOMNode().value;
            this.setState({otherAffiliation: value == "Other" || value == "I am a clinician"});
        }
        return <div className="form-horizontal" onChange={onChange.bind(this)}>
            {this.renderImageUpload('image', 'Profile picture')}
            {this.renderTextInput('email', 'Email *')}
            {this.renderTextInput('email_confirm', 'Confirm Email *')}
            {this.renderPassword('password', 'Password *')}
            {this.renderPassword('password_confirm', 'Confirm Password *')}
            {this.renderTextInput('firstName', 'First Name')}
            {this.renderTextInput('lastName', 'Last Name')}
            {this.renderRadioInlines('title', '', {
                values: [{name: 'M.D.', ref: 'md'}, {name: 'Ph.D', ref: 'phd'}, {name: 'Other', ref: 'other'}]
                , defaultCheckedValue: 'M.D.'
            })}
            {this.renderSelect('affiliation', 'Affiliation', AFFILIATION)}
            {this.state.otherAffiliation &&
                <div className="slide-fade-in">{this.renderTextInput('other_affiliation', <span style={{color: "#D00000"}}>Please Specify:</span>)}</div>}
            {this.renderTextInput('institution', 'Institution, Hospital or Company')}
            {this.renderTextInput('city', 'City')}
            {this.renderTextInput('state', 'State or Province')}
            {this.renderTextInput('country', 'Country')}
            {this.renderTextInput('phone_number', 'Phone number')}
            {this.renderTextarea('comment', 'Comment')}
            {this.renderCheckBox('include_me', "Include me in the community page", true)}
            {this.renderCheckBox('email_me', "Include me in the mailing list", true)}
            {this.renderCheckBox('hide_number', "Hide my phone number on this website")}
            {this.renderCheckBox('hide_email', "Hide my email address on this website")}
            {this.renderCAPTCHA('captcha','CAPTCHA *')}

        </div>
    },
    renderImageUpload: function (id, label) {
        var {imagePreviewUrl, imageTooBig} = this.state;
        var imagePreview = null;
        var error = null;
        if (imagePreviewUrl) {
            imagePreview = (<img src={imagePreviewUrl} className="img-thumbnail" style={{'maxHeight':'160px', 'maxWidth':'160px'}} />);
        }
        if (imageTooBig) {
            error = <p className="bg-danger">Please choose an image less than 4MB</p>
        }
        return this.renderField(id, label,
            <div>
                <input onChange={this.handleImageChange} type="file" accept="image/*"/>
                {imagePreview}
                {error}
            </div>)
    },
    renderTextInput: function (id, label) {
        return this.renderField(id, label,
            <input type="text" className="form-control" id={id} ref={id}/>
        )
    },
    renderPassword: function (id, label) {
        return this.renderField(id, label,
            <input type="password" className="form-control" id={id} ref={id}/>
        )
    },
    renderTextarea: function (id, label) {
        return this.renderField(id, label,
            <textarea className="form-control" id={id} ref={id}/>
        )
    },
    // to specificy different label/value, pass a tuple like ["Label", "Value]
    renderSelect: function (id, label, values) {
        var options = values.map(function (value) {
            return value instanceof Array
                ? <option key={id+value[1]} value={value[1]}>{value[0]}</option>
                : <option key={id+value} value={value}>{value}</option>
        });
        return this.renderField(id, label,
            <select className="form-control" id={id} ref={id}>
                {options}
            </select>
        )
    },
    renderRadioInlines: function (id, label, kwargs) {
        var options = kwargs.values.map(function (value) {
            var defaultChecked = (value.name == kwargs.defaultCheckedValue)
            return <label className="radio-inline">
                <input type="radio" ref={id+value.ref} name={id} value={value.name} defaultChecked={defaultChecked}/>
                {value.name}
            </label>;
        });
        options = <span className="col-sm-9">{options}</span>;
        var other =
            <span className="col-sm-3">
            <input className="form-control" type="text" ref="titlecustom" name="titlecustom"/>
            </span>;
        var optionsWithOther = {options, other};
        return this.renderField(id, label, optionsWithOther)
    },
    renderCheckBox: function (id, label, defaultChecked=false) {
        var checkbox = (<label className="radio-inline">
            <input type='checkbox' ref={id} defaultChecked={defaultChecked}/>
            {label}
        </label>);
        return this.renderField(id, "", checkbox);
    },
    renderCAPTCHA: function(id, label) {
        return this.renderField(id, label, <div ref="signupCAPTCHA"></div>);
    },
    renderField: function (id, label, field) {
        return <div className={$c('form-group', {'has-error': id in this.state.errors})}>
            <label htmlFor={id} className="col-sm-4 control-label">{label}</label>
            <div className="col-sm-6">
                {field}
            </div>
        </div>
    }
});

var trim = function () {
    var TRIM_RE = /^\s+|\s+$/g
    return function trim(string) {
        return string.replace(TRIM_RE, '')
    }
}();

function $c(staticClassName, conditionalClassNames) {
    var classNames = []
    if (typeof conditionalClassNames == 'undefined') {
        conditionalClassNames = staticClassName
    }
    else {
        classNames.push(staticClassName)
    }
    for (var className in conditionalClassNames) {
        if (!!conditionalClassNames[className]) {
            classNames.push(className)
        }
    }
    return classNames.join(' ')
}

module.exports = ({
    Signup: Signup,
    AFFILIATION: AFFILIATION,
    trim:  trim,
    $c : $c
});

// Exports a redux connection at the bottom
import React from 'react';
import { connect } from 'react-redux'
import { Link } from 'react-router'

import * as homeActions from 'dux/HomeReductions'

import Select from 'main_Select/client'
import Nav from 'sub_AppNav'

import Codes from 'db/Codes'

// TODO: Use theming to pick colors
import { RaisedButton, FlatButton, Dialog, Styles } from 'material-ui'

let Home = React.createClass({
  componentWillMount() {
    // Track login state to show/hide presentations button dynamically
    Tracker.autorun(() => {
      if (Meteor.userId()){
        this.props.login();
      } else {
        this.props.logout();
      }
    });
  },

  submitCode(event) {
    event.preventDefault();
    let code = event.target[0].value;
    // Validate code
    let show = Codes.findOne(code)
    this.props.checkCode(show)
  },

  render() {
    let primaryColor = Styles.Colors.cyan500

    let hero = {
      height: '100vh',
      backgroundImage: 'url("http://www.yafta.org/wp-content/uploads/2015/08/yafta_public-speaking_05-3600x2400.jpg")',
      backgroundSize: 'cover',
    }

    const dialogTitle = {
      backgroundColor: primaryColor,
      color: 'white',
      padding: '1rem 2rem',
      fontWeight: '300',
    }

    const createOrJoin = {
      padding: '4rem 0',
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -25%)',
      textAlign: 'center',
      color: 'white',
    }

    const create = {
      // backgroundColor: 'white',
      height: '7rem',
      width: '30rem',
    }

    const join = Object.assign({}, create, {
      textAlign: 'center',
      fontSize: '3rem',
      color: primaryColor,
      margin: '0',
    })

    const actions =
      [
        <FlatButton
          containerElement={<Link to = {`/present/${this.props.showCode}`}/>}
          label="Start Presentation"
          disabled={!!!this.props.showCode}
        />
      ]

    let redirectLink = this.props.home.get('presenter') ? "/present/" + this.props.home.get('presentationCode') : "/audience/" + this.props.home.get('presentationCode')
    let redirect = (
      <FlatButton 
        linkButton
        href={redirectLink}
        label="Join Presentation"
        disabled={!!!this.props.home.get('presentationCode')}
      />
    )

    return (
      <div className="hero" style={hero}>
        <Nav />
        <div>
          <Dialog
            title={<h3 style={dialogTitle}>Select a Presentation</h3>}
            actions={actions}
            autoDetectWindowHeight
            autoScrollBodyContent
            open={this.props.home.get('showSelect')}
            onRequestClose={this.props.openSelect.bind(null, false)}
          ><Select />
          </Dialog>

          <div className="row u-full-width">
            <div className="column" style={createOrJoin}>
              <RaisedButton
                disabled={!this.props.home.get('loggedIn')}
                label={this.props.home.get('loggedIn') ? 'Create!' : 'Login to create'}
                labelStyle={this.props.home.get('loggedIn') ? {color: primaryColor, fontSize: '3rem'} : {fontSize: '2.5rem'}}
                style={create}
                onClick={this.props.openSelect.bind(null, true)}
                onTouchTap={this.props.openSelect.bind(null, true)}
              />
              <div style={{fontSize: '3rem', margin: '1rem'}}>- or -</div>

              <form onSubmit={this.submitCode} style={{margin: '0'}}>
                <input placeholder="Enter Code" maxLength={4} style={join} />
              </form>
              {this.props.home.get('invalidCode') ? 'Please Enter Valid Code' : null}
              {this.props.home.get('presentationCode') && !this.props.home.get('invalidCode') ? redirect : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
})

function mapStateToProps(state) {
  return {
    home: state.home,
    showCode: state.show.showCode
  }
}

export default connect(mapStateToProps, homeActions)(Home)

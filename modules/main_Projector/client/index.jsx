/*
  This is the entry point. Export a react component here.
*/
import React from 'react'
import { connect } from 'react-redux'

import {trackPresenter, trackQuestionMode, setIds} from 'dux/show'
import {trackAudience} from 'dux/audience'
import {getPresentation} from 'dux/deck'

import Slide from 'sub_Slide'
import Grid from 'sub_chat/client/grid'

import Codes from 'db/Codes'

import { Dialog } from 'material-ui'
import { Colors } from 'material-ui/styles'

let Projector = React.createClass({

  componentDidMount() {
    const Code = Codes.findOne(this.props.params.code)
    this.props.setIds(Code)
    this.trackPresenter = trackPresenter(Code.showId)
    this.trackGetDeck = getPresentation(Code.gid)
    this.trackQuestionMode = trackQuestionMode(Code.showId)
    this.trackAudience = trackAudience(Code.showId)
  },

  componentWillUnmount() {
    this.trackPresenter.stop()
    this.trackGetDeck.stop()
    this.trackQuestionMode.stop()
    this.trackAudience.stop()
  },

  render() {
    let primaryColor = Colors.cyan500

    const dialogTitle = {
      backgroundColor: primaryColor,
      color: 'white',
      padding: '1rem 2rem',
      fontWeight: '300',
    }

    return (
      <div>
        <Dialog
          title={<h3 style={dialogTitle}>Questions</h3>}
          titleStyle={{marginBottom: '0'}}
          autoDetectWindowHeight
          autoScrollBodyContent
          open={this.props.show.question}
        ><Grid isProjector/>
        </Dialog>

        <div className="row" style={{textAlign: 'center', height: '1rem', width: '100%'}}>
          <span style={{float: 'left'}}>Presentation Code: {this.props.params.code}</span>
          <span>{window.location.origin}</span>
          <span style={{float: 'right'}}>Viewers: {this.props.viewers}</span>
        </div>

        <div className="row">
          <div className="column" style={{width: '126vh', position: 'absolute', left: '50%', top: '2.1rem', transform: 'translateX(-50%)'}}>
            <Slide />
          </div>
        </div>
      </div>
    )
  }
})

function mapStateToProps (state) {
  return {
    show: state.show,
    viewers: state.audience.get('viewers')
  }
}


export default connect(mapStateToProps, {setIds})(Projector)

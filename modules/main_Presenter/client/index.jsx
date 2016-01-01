/*
  This is the entry point. Export a react component here.
*/
import React from 'react'
import { connect } from 'react-redux'
import { CircularProgress } from 'material-ui'

import * as PresenterActions from 'dux/show'

import {trackPresenter} from 'dux/show'
import {getPresentation} from 'dux/deck'
import {trackAudience} from 'dux/audience'

import Nav from 'sub_AppNav'
import Slide from 'sub_Slide'
import SidebarView from 'sub_SlideSideBar/client'
import AudienceList from 'sub_AudienceList/client'
import Chat from 'sub_chat/client/posts'
import Speedometer from 'sub_Speedometer/client'

// TODO: subscribe for db access instead
import Codes from 'db/Codes'

import { IconButton, FontIcon, Styles } from 'material-ui'

let Presenter = React.createClass({

  componentDidMount() {
    const Code = Codes.findOne(this.props.params.code)
    // set ID data in store.show
    this.props.setIds(Code)
    // start tracker for audience
    this.trackAudience = trackAudience(Code.showId)
    // start tracker that hydrates the store once
    this.trackGetDeck = getPresentation(Code.gid)
    // start tracker for presenter
    this.trackPresenter = trackPresenter(Code.showId)
    // start tracker that hydrates store
    PresenterActions.initialPresentation(Codes.showId)
  },

  componentWillUnmount() {
    this.trackAudience.stop()
    this.trackPresenter.stop()
    this.trackGetDeck.stop()
  },

  styles: {
    progress: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    },
    sidebar: {
      display: 'block',
      maxHeight: '30vh',
      overflowY: 'scroll'
    },
    presenterNav: {
      textAlign: 'right',
    }
  },

  startQA(e) {
    e.stopPropagation()
    // TODO: add "isQA" to db, and subscribe qa mode to it
  },

  openProjector(e) {
    e.stopPropagation()
    window.open('/projector/' + this.props.params.code)
  },

  renderPresenter() {
    const { transitionHandler } = this.props

    return (
      <div>
        <div className="row">
          <div className="six columns">
            <div className="row">
              <div className="ten columns" ref="curSlidePanel">
                Current
                <Slide />
              </div>
              <div className="two columns" style={this.styles.presenterNav}>
                <IconButton
                  tooltip="Previous Slide"
                  onClick={() => transitionHandler(-1)}
                  onTapTouch={() => transitionHandler(-1)}
                ><FontIcon
                  hoverColor={Styles.Colors.cyan500}
                  className="material-icons"
                >chevron_left</FontIcon>
                </IconButton>

                <IconButton
                  tooltip="Next Slide"
                  onClick={() => transitionHandler(1)}
                  onTapTouch={() => transitionHandler(1)}
                ><FontIcon
                  hoverColor={Styles.Colors.cyan500}
                  className="material-icons"
                >chevron_right</FontIcon>
                </IconButton>

                <IconButton
                  tooltip="Open Projector"
                  onClick={this.openProjector}
                  onTapTouch={this.openProjector}
                ><FontIcon
                  hoverColor={Styles.Colors.cyan500}
                  className="material-icons"
                >input</FontIcon>
                </IconButton>

                <IconButton
                  tooltip="Start Q&A"
                  onClick={this.startQA}
                  onTapTouch={this.startQA}
                ><FontIcon
                  hoverColor={Styles.Colors.cyan500}
                  className="material-icons"
                >help</FontIcon>
                </IconButton>
              </div>
            </div>
            <div className="row">
              Next
              <Slide slideIndex={this.props.show.presenterIndex + 1} />
            </div>
          </div>
          <div className="six columns">
            <div className="row">
              <div id="sidebar_container" className="two columns" style={this.styles.sidebar} >
                <SidebarView deck={this.props.deck} end={this.props.show.numSlides}/>
              </div>
              <div className="ten columns">
                <AudienceList audience={this.props.audience.toArray()} />
              </div>
            </div>
            <div className="row">
              <Chat presentationId={this.props.params.showId} />
            </div>
          </div>
        </div>
      </div>
    )
  },

  renderLoad() {
    return (
      <div>
        <div>Loading. Please wait.</div><br />
        <CircularProgress mode="indeterminate" size={1} style={this.styles.progress} />
      </div>
    )
  },

  render() {
    return (
      <div>
        <Nav />
        <div id="app" className="container">
          {
            this.props.deck.length ? this.renderPresenter() : this.renderLoad()
          }
        </div>
      </div>
    )
  }
})

function mapStateToProps (state) {
  return {
    presenter: state.presenter,
    presentation: state.previews,
    deck: state.deck,
    audience: state.audience.get('audience'),
    show: state.show
  }
}

export default connect(mapStateToProps, PresenterActions)(Presenter)

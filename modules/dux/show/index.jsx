import Shows from 'db/Shows'

//////////////////
// ACTION TYPES //
//////////////////

const SET_PRESENTER_INDEX = 'SET_PRESENTER_INDEX'
const SET_MAX = 'SET_MAX'
const NUM_SLIDES = 'NUM_SLIDES'
const SET_CURRENT_SLIDE = 'SET_CURRENT_SLIDE'
const SET_IDS = 'SET_IDS'
const SET_CODE = 'SET_CODE'
const SET_TRANSITION_INDEX = 'SET_TRANSITION_INDEX'
const SET_MAX_TRANSITION = 'SET_MAX_TRANSITION'
const SET_PRESENTER_TRANSITION = 'SET_PRESENTER_TRANSITION'
const INITIALIZE_PRESENTATION = 'INITIALIZE_PRESENTATION'
const SET_QA = 'SET_QA'

////////////////////////
// INTERNAL FUNCTIONS //
////////////////////////


// setSlide internal function for the tracker to change
const setPresenter = function (index) {
  return {
    type: SET_PRESENTER_INDEX,
    payload: index
  }
}

const setPresenterTransition = function (index) {
  return {
    type: SET_PRESENTER_TRANSITION,
    payload: index
  }
}

const setMaxTransition = function (index) {
  return { 
    type: SET_MAX_TRANSITION,
    payload: index
  }
}

const setTransitionIndex = function (index) {
  return { 
    type: SET_TRANSITION_INDEX,
    payload: index
  }
}

// setMax calls this helper dispatch function
const newMax = function (index) {
  return {
    type: SET_MAX,
    payload: index,
  }
}

// internal function for setIndex to change the current slide
const setSlide = function(index) {
  return {
    type: SET_CURRENT_SLIDE,
    payload: index
  }
}

const setCode = function (code) {
  return {
    type: SET_CODE,
    payload: code
  }
}

const initializePresentation = function (info) {
  return {
    type: INITIALIZE_PRESENTATION,
    payload: info
  }
}

const setQA = function (state) {
  return { 
    type: SET_QA,
    payload: state
  }
}

// setMax internal function for the tracker to change
const setMax = function (index, transition, maxTransition) {
  return function (dispatch, getState) {
    const { show } = getState()

    if (show.currentIndex === show.presenterIndex){
      // change currnent slide if it's matching the presenter's current slide
      dispatch(setSlide(index)) 
      // set maxTransition to DB maxTransition if current slides match up     
      dispatch(setMaxTransition(maxTransition))
      if(show.currentTransition === show.presenterTransition){
        // change current Transition if it matches presenter's current transition
        dispatch(setTransitionIndex(transition))
      }
    }
    if(show.maxTransition < maxTransition && show.currentIndex < show.maxIndex) {
      console.log('should update')
      dispatch(setMaxTransition(maxTransition))
    }
    if(show.maxIndex < index){
      dispatch(newMax(index))
    }
  }
}

///////////////////////
// TRACKER FUNCTIONS //
///////////////////////
// stop trackers with <<trackername>>.stop()


// track the maxIndex and presenterIndex from the server
export function trackPresenter (id) {
  return Tracker.autorun(function (computation) {
    Meteor.subscribe('show', id)
    let show = Shows.findOne({_id: id})
    if (show){
      let {dispatch} = require('../store.js')
      dispatch(setMax(show.presenterIndex, show.presenterTransition, show.maxTransition))
      // set presenter transition and index via DB updates
      dispatch(setPresenter(show.presenterIndex))
      dispatch(setPresenterTransition(show.presenterTransition))
      // set the current slide to presenterIndex if owner is logged in
      // if persenter has to reload, position will not be lost
      if (show.ownerId === Meteor.userId()){
        dispatch(setSlide(show.presenterIndex))
        dispatch(setTransitionIndex(show.presenterTransition))
      }
    }
  })
}

export function trackQuestionMode (showId) {
  return Tracker.autorun(function (computation) {
    Meteor.subscribe('show', showId)
    let show = Shows.findOne({_id: showId})
    if (show) {
      let { dispatch } = require('../store.js')
      dispatch(setQA(show.questionMode))
    }
  })
}
//////////////////////
// EXPORTED ACTIONS //
//////////////////////


export function setShow (code) {
  return function (dispatch) {
    dispatch(setCode(code))
  }
}

// actions to hydrate store and initialize presentation on first load
export function initialPresentation (id) {
  return Tracker.autorun(function (computation) {
    let {dispatch} = require('../store.js')
    Meteor.subscribe('show', id)
    let show = Shows.findOne({_id: id})
    if (show){
      let newState = {
        maxIndex: show.maxIndex,
        maxTransition: show.maxTransition,
        presenterIndex: show.presenterIndex,
        presenterTransition: show.presenterIndex,
        currentIndex: show.presenterIndex,
        currentTransition: show.presenterTransition
      }
      dispatch(initializePresentation(newState))
      computation.stop()
    }
  })
}

// actions to handle next and previous button clicks
export function transitionHandler (operator) {
  return function(dispatch, getState) {
    let { show, transitions } = getState()
    // increment transition by operator
    let transition = show.currentTransition + operator
    let index = show.currentIndex
    if (transition < 0) {
      // set transition to either length of previous slide transitions or 0
      transition = transitions[index - 1].length ? transitions[index - 1].length : 0
      dispatch(decrement())
    } else if (transition > transitions[index].length) {
      dispatch(increment())
    } else {
      dispatch(setIndex(index, 0, transition))
    }
  }
}

// actions to increment slide
export function increment() {
  return setIndex(null, 1, 0)
}

// actions to decrement slide
export function decrement() {
  return function (dispatch, getState) {
    let { show, transitions } = getState()
    let transition = transitions[show.currentIndex - 1].length ? transitions[show.currentIndex - 1].length : 0
    dispatch(setIndex(null, -1, transition))
  } 
}

// action to manually set index using the first arg
export function setIndex(index, operator, transition) {
  return function(dispatch, getState){
    const { show, transitions } = getState()

    // get the desired index if !index
    if (index === null){
      index = show.currentIndex + operator
    }

    // if transition is not defined, set to 0
    if (!transition){
      transition = 0
    }

    // check if out of bounds
    if (index < 0 || index >= show.numSlides){
      console.log('out of bounds: ', index, ' from ', show.numSlides, ' slides')
      return '';
    }

    // update persenterIndex if owner && not out of bounds
    // owner is unaffected by maxIndex
    if (Meteor.userId() === show.ownerId){
      // sends the index to update the presenterIndex and maxIndex
      Meteor.call('ownerShowUpdate', index, transition, show.showId, function (err, result) {
        if(err){
          console.log('update failed')
        } else {
          // used to dispatch store action here, use tracker instead (not optimisic)   
        }
      })

    // if not an owner... check if index or transition index ahead of owner
    } else if (index > show.maxIndex || (index === show.maxIndex && transition > show.maxTransition)){
      console.log('cannot be ahead of presenter: ', index, ' from ', show.maxIndex, ' slides')
      return '';
    // if ok, change store index without touching db
    } else {
      if(show.maxIndex === index) {
        transition = show.maxTransition
      } else if (transitions[index].length) {
        transition = transitions[index].length
      }
      // increment currentIndex using set
      dispatch(setSlide(index))
      // increment currentTransition
      dispatch(setTransitionIndex(transition))
    }
  }
}

// set the number of slides in a presentation
export function numSlides (num) {
  return {
    type: NUM_SLIDES,
    payload: num,
  }
}

// takes in a code document returned from mongo
export function setIds (obj) {
  return {
    type: SET_IDS,
    payload: {
      gid: obj.gid,
      showId: obj.showId,
      ownerId: obj.ownerId,
    }
  }
}


const initialState = {
  currentTransition: 0,
  currentIndex: 0,
  maxIndex: 0,
  maxTransition: 0,
  numSlides: 1,
  presenterIndex: 0,
  presenterTransition: 0,
  ownerId: null,
  showId: null,
  gid: null,
  showCode: null,
  question: false
}

//////////////
// REDUCERS //
//////////////

export default function (state = initialState, action) {
  switch (action.type) {
  case SET_CODE: 
    return Object.assign({}, state, {showCode: action.payload})
  case NUM_SLIDES:
    return Object.assign({}, state, {numSlides: action.payload})
  case SET_MAX:
    return Object.assign({}, state, {maxIndex: action.payload})  
  case SET_CURRENT_SLIDE:
    return Object.assign({}, state, {currentIndex: action.payload})
  case SET_PRESENTER_INDEX:
    return Object.assign({}, state, {presenterIndex: action.payload})
  case SET_IDS:
    return Object.assign({}, state, action.payload)
  case SET_TRANSITION_INDEX:
    return Object.assign({}, state, {currentTransition: action.payload})
  case SET_MAX_TRANSITION: 
    return Object.assign({}, state, {maxTransition: action.payload}) 
  case SET_PRESENTER_TRANSITION: 
    return Object.assign({}, state, {presenterTransition: action.payload})
  case INITIALIZE_PRESENTATION:
    return Object.assign({}, state, action.payload)
  case SET_QA:
    return Object.assign({}, state, {question: action.payload})
  default:
    return state;
  }
}

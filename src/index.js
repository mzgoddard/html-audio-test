'use strict';

import $ from 'jquery';
import _ from 'lodash';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import Promise from 'bluebird';

import { Howl } from 'howler';

import { Sound } from 'soundjs';

import { test, tests } from './test';

import beepUri from './sounds/g4.wav';
import seeSawUri from './sounds/c4.wav';
import soundspriteUri from './sounds/soundsprite.wav';
import soundspriteJson from 'json-loader!./sounds/soundsprite.json';

let render = function(reactEl) {
  ReactDOM.render(reactEl, document.querySelector('#ui'));
};

let unmount = function() {
  render(<Placeholder />);
  // ReactDOM.unmountComponentAtNode(document.querySelector('#ui'));
};

function Placeholder() {
  return <div className="placeholder"></div>;
}

class UserAction extends Component {
  render() {
    return <div className="button" onClick={this.props.onClick} onTouchStart={this.props.onClick}>
      Click Me
    </div>;
  }
}

function userAction(onClick) {
  return new Promise((resolve, reject) => {
    let _onClick = () => {
      Promise.try(onClick || (() => {})).delay(300).then(resolve, reject);
    };
    render(<div><UserAction onClick={_onClick} /></div>);
  });
}

class UserResponse extends Component {
  render() {
    return <div>
      <div className="button" onClick={this.props.onSuccess}>Played</div>
      <div className="button" onClick={this.props.onFailure}>Did not Play</div>
    </div>;
  }
}

function userResponse() {
  return new Promise((resolve, reject) => {
    render(<div>
      <UserResponse
      onSuccess={resolve}
      onFailure={() => reject(new Error('Did not play'))}
      />
    </div>);
  });
}

function userActionResponse(onClick) {
  return new Promise((resolve, reject) => {
    render(<div>
      <UserAction onClick={onClick} />
      <UserResponse
      onSuccess={resolve}
      onFailure={() => reject(new Error('Did not play'))}
      />
    </div>);
  });
}

class Report extends Component {
  render() {
    return <div>
      {this.props.tests.map(test => <div key={test.key} className={test.state}>{test.name}</div>)}
    </div>;
  }
}

function prepTag(src) {
  // return Promise.resolve(tag);
  return new Promise(resolve => {
    let tag = new Audio();
    tag.oncanplay = () => (resolve(tag), console.log('canplay'));
    // tag.preload = 'auto';
    tag.src = src;
    tag.load();
    tag.play();
    tag.pause();
    // tag.play();
    // tag.pause();
    // tag.onstalled = () => {
    //   tag.load();
    //   tag.play();
    //   tag.pause();
    // };
    // TODO
    // setTimeout(() => resolve(tag), 500);
  });
}

function tagPlays(src) {
  let tag = new Audio();
  tag.src = src;
  tag.oncanplaythrough = function() {
    tag.oncanplaythrough = null;
    tag.play();
  };
  return new Promise(resolve => {
    tag.onplaying = resolve;
  })
  .then(() => tag.pause())
  .timeout(2500);
}

let context = new Promise(resolve => resolve(new (window.AudioContext || window.webkitAudioContext)()));

function decodeBuffer(src) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', src);
    xhr.send();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = reject;
  })
  .then(buffer => Promise.all([buffer, context]))
  .then(([buffer, context]) => {
    return new Promise((resolve, reject) => context.decodeAudioData(buffer, resolve, reject));
  });
}

let beepBufferPromise = decodeBuffer(beepUri);
let seeSawBufferPromise = decodeBuffer(seeSawUri);

let sources = [];

function prepSource(bufferPromise) {
  let source;
  return context
  .then(context => {
    source = (context.createBufferSource || context.createBufferSourceNode).call(context);
    sources.push(source);
    return Promise.all([bufferPromise, context]);
  })
  .then(([buffer, context]) => {
    source.buffer = buffer;
    source.connect(context.destination);
    return source;
  });
}

function webaudioPlays(bufferPromise) {
  return prepSource(bufferPromise)
  .tap(source => source.start(0));
}

function webaudioStopAll() {
  return Promise.map(sources, source => source.disconnect())
  .then(() => { sources.length = 0; });
}

function tagSpritePlays() {}

function tagSpriteStop() {}

test('audio tag', function() {
  new Audio();
});

test('webaudio', function() {
  return context;
});

test('pre-action tag playback', function() {
  let tagPromise = prepTag(seeSawUri);
  return tagPromise
  .then(tag => tag.play())
  .then(userResponse)
  .return(tagPromise)
  .then(tag => tag.pause());
});

test('user action', function() {
  return new Promise(resolve => {
    render(<UserAction onClick={resolve} />);
  });
});

// test('user response', function() {
//   return userResponse();
// });

let userLessSource = test('user-less webaudio playback', function() {
  return webaudioPlays(seeSawBufferPromise)
  .then(userResponse)
  .then(webaudioStopAll);
});

let userLessTag = test('user-less tag playback', function() {
  let tagPromise = prepTag(seeSawUri);
  return tagPromise
  .then(tag => tag.play())
  .then(userResponse)
  .return(tagPromise)
  .then(tag => tag.pause());
});

test('user action webaudio playback', userLessSource, function() {
  let sourcePromise = prepSource(seeSawBufferPromise);
  return sourcePromise
  .then(source => userAction(() => source.start(0)))
  .then(userResponse)
  .then(webaudioStopAll);
});

test('user action tag playback', userLessTag, function() {
  let tagPromise = prepTag(seeSawUri)
  return tagPromise
  .then(tag => userAction(() => tag.play()))
  .then(userResponse)
  .return(tagPromise)
  .then(tag => tag.pause());
});

let userLessSecondSource = test('user-less source second playback', function() {
  return webaudioPlays(beepBufferPromise)
  .then(userResponse)
  .then(webaudioStopAll);
});

let userLessSecondTag = test('user-less tag second playback', function() {
  let tagPromise = prepTag(beepUri);
  return tagPromise
  .then(tag => tag.play())
  .then(userResponse)
  .return(tagPromise)
  .then(tag => tag.pause());
});

test('user action continuous tag playback', function() {
  let tagPromise = prepTag(soundspriteUri);
  return tagPromise
  .then(tag => userAction(() => {
    tag.currentTime = soundspriteJson.beep.offset / 44100;
    tag.oncanplay = () => tag.play();
    tag.ontimeupdate = () => {
      if (tag.currentTime < soundspriteJson.beep.offset / 44100 - 0.5) {
        tag.pause();
      }
      if (tag.currentTime > soundspriteJson.beep.end / 44100) {
        tag.currentTime = soundspriteJson.beep.offset / 44100;
        tag.oncanplay = () => tag.play();
      }
    };
  }))
  .then(userResponse)
  .return(tagPromise)
  .then(tag => tag.pause());
});

test('two tags playing', function() {
  let tagPromises = Promise.all([prepTag(seeSawUri), prepTag(beepUri)]);
  return tagPromises
  .then(tags => tags.forEach(tag => tag.play()))
  .then(userResponse)
  .return(tagPromises)
  .then(tags => tags.forEach(tag => tag.pause()));
});

test('two web audio sources playing', function() {
  let sourcePromises = Promise.map([seeSawBufferPromise, beepBufferPromise], prepSource);
  return sourcePromises
  .then(sources => sources.forEach(source => source.start(0)))
  .then(userResponse)
  .then(webaudioStopAll);
});

test('one tag and one web audio source playing together', function() {
  let promises = Promise.all([prepTag(seeSawUri), prepSource(beepBufferPromise)]);
  return promises
  .then(([tag, source]) => { source.start(0); tag.play(); })
  .then(userResponse)
  .return(promises)
  .then(([tag]) => tag.pause())
  .then(webaudioStopAll);
});

test('howler', function() {
  if (typeof Howl === 'undefined') {
    throw new Error('Howl not defined');
  }
});

test('howler repeated sprite playback', function() {
  let h = new Howl({
    urls: [soundspriteUri],
    sprite: {
      beep: [3000, 1000],
    },
  });
  let play = function() {
    return new Promise(resolve => { h.play('beep'); h.on('end', resolve); })
    .delay(1);
  };
  return new Promise((resolve, reject) => (h.on('load', resolve), h.on('loaderror', reject)))
  .return()
  .then(userAction)
  .then(unmount)
  .then(play)
  .then(play)
  .then(userResponse);
});

test('soundjs', function() {
  if (typeof Sound === 'undefined') {
    throw new Error('Sound not defined');
  };
});

test('soundjs repeated sprite playback', function() {
  Sound.registerSounds([
    {
      src: soundspriteUri,
      data: {
        audioSprite: [
          { id: 'beep', startTime: 3000, duration: 1000 },
        ],
      },
    },
  ]);
  let play = function() {
    return new Promise(resolve => { Sound.play('beep'); setTimeout(resolve, 1000); })
    .delay(1);
  };
  return new Promise((resolve, reject) => (Sound.on('fileload', resolve), Sound.on('fileerror', reject)))
  .return()
  .then(userAction)
  .then(unmount)
  .then(play)
  .then(play)
  .then(userResponse);
});

function Rerun() {
  return <div className="button" onClick={run}>Run Again</div>;
}

function run() {
  tests.forEach(test => test.reset());

  ReactDOM.render(<Report tests={tests} />, document.querySelector('#report'));

  Promise.reduce(tests, function(carry, test) {
    return Promise.resolve()
    .delay(100)
    .then(function() {
      let promise = test.run();
      ReactDOM.render(<Report tests={tests} />, document.querySelector('#report'));
      return promise;
    })
    .catch(() => {})
    .then(() => {
      unmount();
      ReactDOM.render(<Report tests={tests} />, document.querySelector('#report'));
    });
  }, null)
  .then(() => render(<Rerun />));
}

unmount();
run();

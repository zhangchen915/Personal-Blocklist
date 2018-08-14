import React from 'react';
import {render} from 'react-dom';
import SimpleTabs from './tab';

import './index.css';
import {Domain} from './data';

render( <SimpleTabs db={new Domain()}/>, document.querySelector('#app'));
import { Store } from '../rplugin/node/vim-package-info/more.js';

const render = (lang, dep, value) => console.log(lang, dep, value);
global.store = new Store({}, render);

import App from './App.html';
import  ComicStore  from './comicStore.js';

const store = new ComicStore({
	name: 'world',
	imageList:[]
});

const app = new App({
	target: document.body,
	store
});

export default app;
window.store=store

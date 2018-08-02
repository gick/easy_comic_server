import { Store } from 'svelte/store.js'
export default class ComicStore extends Store {
	async fetchImages() {
		const imageList = await fetch('http://localhost:8080/listImages').then(r => r.json())
		this.set({ imageList })
	};
	 removeImage(resourceId){
		 fetch('http://localhost:8080/file/'+resourceId,{'method':'delete'})
		 let imageList=this.get().imageList.filter(image => image._id !== resourceId)
		 this.set({ imageList })
	}
}

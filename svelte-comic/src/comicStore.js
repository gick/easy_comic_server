import { Store } from 'svelte/store.js'
class ComicStore extends Store {
	 removeImage(resourceId){
		 fetch('http://localhost:8080/file/'+resourceId,{'method':'delete'})
		 let imageList=this.get().imageList.filter(image => image._id !== resourceId)
		 this.set({ imageList })
	}
	async fetchImages(){
		const imageList = await fetch('http://localhost:8080/listImages').then(r => r.json())
		this.set({ imageList })
	}

}
export default ComicStore

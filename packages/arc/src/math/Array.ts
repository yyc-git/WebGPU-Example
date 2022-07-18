export let flatten = <T>(array: Array<Array<T>>): Array<T> => {
	return array.reduce((result, arr) => {
		return result.concat(arr)
	}, [])
}
export default function Button(props) {
  return (
    <button 
      type="button" 
      className="px-4 py-2 bg-blue-600 text-white rounded border-none cursor-pointer transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      {...props} 
    />
  )
}

import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import DatabaseTest from './DatabaseTest'

function App(): JSX.Element {
  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <DatabaseTest />
      <Versions></Versions>
    </>
  )
}

export default App

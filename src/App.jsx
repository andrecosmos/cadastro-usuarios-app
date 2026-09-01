import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import UserCard from './components/UserCard'

function App() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState(0)
  const [users, setUsers] = useState([])

  useEffect(
    () => {
      async function buscarUsuarios() {
        const resposta = await axios.get('/api/get-users')
        setUsers(resposta.data)
      }
      buscarUsuarios()
    }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const novoUsuario = {
      nome: name,
      email,
      idade: age
    }

    const resposta = await axios.post('/api/create-user', novoUsuario)

    setUsers([...users, resposta.data])
  }

  return (
    <>
      <section id="center">
        <div className="hero">
          <form onSubmit={handleSubmit} >
            <h1>Cadastro de Usuários</h1>
            <input type="text" placeholder="Nome : " onChange={e => setName(e.target.value)} />
            <input type="email" placeholder="E-mail" onChange={e => setEmail(e.target.value)} />
            <input type="number" placeholder="Idade" onChange={e => setAge(Number(e.target.value))} />
            <button type="submit">Cadastrar</button>
          </form>
        </div>
        <div className="user_list">
          <h2>Lista de Usuários Cadastrados</h2>
          {users.map((user) => (
            <UserCard key={user._id} user={user} />)
          )}
        </div>
      </section>


    </>
  )
}

export default App

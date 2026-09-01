

function UserCard ({user}){

    return(
        <>
         <div className="baseline">
           <div className="card" >
                <p className="linha">Nome: {user.nome}</p>
                <p className="linha">E-mail: {user.email}</p>
                <p className="linha">Idade: {user.idade}</p>
            </div>
         </div>
        </>
    )
}

export default UserCard
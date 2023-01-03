import * as anchor from '@project-serum/anchor'
import { useEffect, useMemo, useState } from 'react'
import { TODO_PROGRAM_PUBKEY } from '../constants'
import todoIDL from '../constants/todo.json'
import toast from 'react-hot-toast'
import { SystemProgram } from '@solana/web3.js'
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey'
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { authorFilter } from '../utils'

// Static data that reflects the todo struct of the solana program
let dummyTodos = [
    {
        account:{
            idx: '0',
            content: 'Finish the essay collaboration',
            marked: false,
        }

    },
    {
        account:{
            idx: '1',
            content: 'Understand Static Todo App',
            marked: false,          
        }

    },
    {
        account:{
            idx: '2',
            content: 'Read next chapter of the book in Danish',
            marked: false,   
        }
    },
    {
        account:{
            idx: '3',
            content: 'Do the math for next monday',
            marked: false,   
        }
    },
    {
        account:{
            idx: '4',
            content: 'Send the finished assignment',
            marked: true,  
        }
    },
    {
        account:{
            idx: '5',
            content: 'Read english book chapter 5',
            marked: true,          
        }
    },
]


export function useTodo() {
    const { connection } = useConnection()
    const { publicKey } = useWallet()
    const anchorWallet = useAnchorWallet()

    const [initialized, setInitialized] = useState(false)
    const [lastTodo, setLastTodo] = useState(0)
    const [todos, setTodos] = useState([])
    const [loading, setLoading] = useState(false)
    const [transactionPending, setTransactionPending] = useState(false)
    const [input, setInput] = useState("")


    const program = useMemo(() => {
        if (anchorWallet) {
            const provider = new anchor.AnchorProvider(connection, anchorWallet, anchor.AnchorProvider.defaultOptions())
            return new anchor.Program(todoIDL, TODO_PROGRAM_PUBKEY, provider)
        }
    }, [connection, anchorWallet])

    useEffect(() => {
   
        const findProf=async()=>{
            if(program && publicKey && !transactionPending)
            {
               try{
             setLoading(true)
             const [profilePda,profileBump]=await findProgramAddressSync([utf8.encode('USER_STATE'),publicKey.toBuffer()],program.programId)
              const profAcc=await program.account.userProfile.fetch(profilePda)
              if (profAcc)
              {
                setLastTodo(profAcc.lastTodo)
                setInitialized(true)
                const todoAcc=await program.account.todoAccount.all([authorFilter(publicKey.toString())])
            setTodos(todoAcc)
            }
            else{
                console.log("not yet initialized")
                setInitialized(false)
            }
            }catch(e)
               {
                console.log(e)
                setInitialized(false)
                setTodos([])
               }
               finally{
                setLoading(false)

               }
            }
            {

            }
        }

  findProf()
    }, [publicKey,program,transactionPending])

    const handleChange = (e)=> {
        setInput(e.target.value)
    }
  
    const initializeUser =async () => {
        if(program && publicKey)
        {
            try{
                setTransactionPending(true)
                const [profilePda,profileBump]=await findProgramAddressSync([utf8.encode('USER_STATE'),publicKey.toBuffer()],program.programId)
                const tx=await program.methods.initialize()
                .accounts({
                    userProfile:profilePda,
                    authority:publicKey,
                    systemProgram:SystemProgram.programId
                })
                .rpc()
                setInitialized(true)
                toast.success('Success')
            }
            catch(e)
            {
                console.log(e)
            }
        }
    }
    const initializeStaticUser = () => {
        setInitialized(true)
    }

    const addStaticTodo = async(e) => {
    e.preventDefault()
       if(program && publicKey)
        {
            try{
                setTransactionPending(true)
                const [profilePda,profileBump]=await findProgramAddressSync([utf8.encode('USER_STATE'),publicKey.toBuffer()],program.programId)
                const [todoPda,todoBump]=await findProgramAddressSync([utf8.encode('TODO_STATE'),publicKey.toBuffer(),Uint8Array.from([lastTodo])],program.programId)
                if(input){
                    await program.methods.addTodo(input)
                .accounts({
                    userProfile:profilePda,
                    todoAccount:todoPda,
                    authority:publicKey,
                    systemProgram:SystemProgram.programId
                })
                .rpc()
                setInitialized(true)
                toast.success('Success')
                }

            }
            catch(e)
            {
                console.log(e)
            }
            finally{
               setTransactionPending(false)
               setInput("")
            }
        }
    }

    const markStaticTodo = async(todoPda,todoIdx) => {

        if(program && publicKey)
         {
             try{
                 setTransactionPending(true)
                 setLoading(true)
                 const [profilePda,profileBump]=await findProgramAddressSync([utf8.encode('USER_STATE'),publicKey.toBuffer()],program.programId)

                     await program.methods.markTodo(todoIdx)
                 .accounts({
                     userProfile:profilePda,
                     todoAccount:todoPda,
                     authority:publicKey,
                     systemProgram:SystemProgram.programId
                 })
                 .rpc()
                 toast.success('Success')
                 
 
             }
             catch(e)
             {
                 console.log(e)
             }
             finally{
                setLoading(false)
                setTransactionPending(false)
             }
         } 
       
    }

    const removeStaticTodo = async (todoPda,todoIdx) => {
        if(program && publicKey)
        {
            try{
                setTransactionPending(true)
                setLoading(true)
                const [profilePda,profileBump]=await findProgramAddressSync([utf8.encode('USER_STATE'),publicKey.toBuffer()],program.programId)

                    await program.methods.removeTodo(todoIdx)
                .accounts({
                    userProfile:profilePda,
                    todoAccount:todoPda,
                    authority:publicKey,
                    systemProgram:SystemProgram.programId
                })
                .rpc()
                setInitialized(true)
                toast.success('Success')
                

            }
            catch(e)
            {
                console.log(e)
            }
            finally{
               setLoading(false)
               setTransactionPending(false)
               setInput("")
            }
        } 
    }


    const incompleteTodos = useMemo(() => todos.filter((todo) => !todo.account.marked), [todos])
    const completedTodos = useMemo(() => todos.filter((todo) => todo.account.marked), [todos])

    return { initialized, initializeUser, loading, transactionPending, completedTodos, incompleteTodos, markStaticTodo, removeStaticTodo, addStaticTodo, input, setInput, handleChange }
}

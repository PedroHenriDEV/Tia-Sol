'use client';
import {useState} from 'react';
import {Sidebar} from './sidebar';
import {Header} from './header';
import {BottomNav} from './bottom-nav';
export function AppShell({children,email}:{children:React.ReactNode;email:string}){const[open,setOpen]=useState(false);return <div className="min-h-screen bg-[var(--background)]"><Sidebar open={open} onClose={()=>setOpen(false)}/><div className="lg:pl-[var(--sidebar-width)]"><Header email={email} onMenu={()=>setOpen(true)}/><main className="mx-auto w-full max-w-[1500px] px-4 pb-24 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10 lg:pt-8">{children}</main></div><BottomNav/></div>}

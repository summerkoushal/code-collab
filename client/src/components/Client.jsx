import React from 'react'
import Avatar from 'react-avatar'

export default function Client(props) {
  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <Avatar name={ props.username.toString() } size={50} round="14px" className='mr-3' />
        <span className='mx-2 ' >{ props.username.toString() }</span>
      </div>
    </div>
  )
}

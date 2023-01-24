const addButton = document.createElement('button')
addButton.setAttribute('id', 'add-btn')
addButton.innerText = 'Add'
addButton.addEventListener('click', () => {
    alert('Clicked!')
})
document.body.appendChild(addButton)

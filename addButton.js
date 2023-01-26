
const topCard = document.querySelector('.jobs-unified-top-card__content--two-pane')
const buttonsContainer = topCard.querySelector('.display-flex')
const addButton = document.createElement('button')

addButton.setAttribute('class', 'artdeco-button artdeco-button--3 artdeco-button--secondary add-button')
addButton.innerText = '+ Add'
addButton.style.marginLeft = '9px'
addButton.addEventListener('click', () => {
    alert('Clicked!')
})
buttonsContainer.appendChild(addButton)





// document.body.appendChild(addButton)

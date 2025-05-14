export const random = (min, max) => Math.random() * (max - min) + min;

export const showModal = (modalId) => {
    const modals = [
        document.getElementById('modalWelcome'),
        document.getElementById('modalGameOver'),
        document.getElementById('modalWin')
    ];
    modals.forEach(modal => {
        if (modal) modal.classList.add('hidden');
    });
    if (modalId) {
        const targetModal = document.getElementById(modalId);
        if (targetModal) targetModal.classList.remove('hidden');
    }
};
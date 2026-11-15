/**
 * Modal handlers for ticket editing and safe raffle reset
 */
const ModalManager = {
  activeNumber: null,

  /**
   * Initialize modal DOM elements and events
   */
  init({ onSaveTicket, onReleaseTicket, onConfirmReset }) {
    this.onSaveTicket = onSaveTicket;
    this.onReleaseTicket = onReleaseTicket;
    this.onConfirmReset = onConfirmReset;

    this.ticketModal = document.getElementById('modal');
    this.resetModal = document.getElementById('modal-reset');

    // Input fields
    this.nameInput = document.getElementById('nombre');
    this.abonoGroup = document.getElementById('abono-group');
    this.abonoInput = document.getElementById('monto-abono');
    this.btnLiberar = document.getElementById('liberar');

    // Reset confirmation inputs
    this.resetInput = document.getElementById('confirm-reset-input');
    this.btnConfirmReset = document.getElementById('btn-confirm-reset');

    this.bindEvents();
  },

  bindEvents() {
    // Status option radio chips
    const statusOptions = document.querySelectorAll('.status-option');
    statusOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const status = opt.dataset.status;
        this.selectStatus(status);
      });
    });

    // Preset deposit buttons
    const presets = document.querySelectorAll('.abono-presets button');
    presets.forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = btn.dataset.amount;
        if (this.abonoInput) {
          this.abonoInput.value = amount;
        }
      });
    });

    // Reset input validation
    if (this.resetInput && this.btnConfirmReset) {
      this.resetInput.addEventListener('input', () => {
        const text = this.resetInput.value.trim().toUpperCase();
        this.btnConfirmReset.disabled = text !== 'REINICIAR';
      });
    }

    // Modal backdrops click to close
    if (this.ticketModal) {
      this.ticketModal.addEventListener('click', (e) => {
        if (e.target === this.ticketModal) this.closeTicketModal();
      });
    }

    if (this.resetModal) {
      this.resetModal.addEventListener('click', (e) => {
        if (e.target === this.resetModal) this.closeResetModal();
      });
    }
  },

  /**
   * Sets the visual selection of the payment status chips
   */
  selectStatus(status) {
    document.querySelectorAll('.status-option').forEach(opt => {
      opt.className = 'status-option';
      if (opt.dataset.status === status) {
        opt.classList.add(`selected-${status}`);
      }
    });

    if (this.abonoGroup) {
      this.abonoGroup.style.display = status === 'abono' ? 'block' : 'none';
      if (status === 'abono' && (!this.abonoInput.value || Number(this.abonoInput.value) <= 0)) {
        this.abonoInput.value = '5000';
      }
    }
  },

  getSelectedStatus() {
    const selected = document.querySelector('.status-option[class*="selected-"]');
    return selected ? selected.dataset.status : 'pendiente';
  },

  /**
   * Opens the ticket edit modal
   */
  openTicketModal(ticket) {
    this.activeNumber = ticket.ticketNumber;
    document.getElementById('modalTitulo').textContent = `Número ${ticket.ticketNumber}`;

    this.nameInput.value = ticket.buyerName || '';
    const initialStatus = ticket.status === 'disponible' ? 'pendiente' : ticket.status;
    this.selectStatus(initialStatus);

    if (this.abonoInput) {
      this.abonoInput.value = ticket.amountPaid > 0 && ticket.amountPaid < 10000 ? ticket.amountPaid : '';
    }

    if (this.btnLiberar) {
      this.btnLiberar.style.display = ticket.buyerName ? 'inline-flex' : 'none';
    }

    this.ticketModal.classList.add('abierto');
    setTimeout(() => this.nameInput.focus(), 50);
  },

  closeTicketModal() {
    this.ticketModal.classList.remove('abierto');
    this.activeNumber = null;
  },

  /**
   * Save ticket button trigger
   */
  handleSave() {
    const buyerName = this.nameInput.value.trim();
    if (!buyerName) {
      UI.showToast('Por favor escribe el nombre del comprador', 'warning');
      this.nameInput.focus();
      return;
    }

    const status = this.getSelectedStatus();
    let amountPaid = 0;

    if (status === 'pagado') {
      amountPaid = 10000;
    } else if (status === 'abono') {
      amountPaid = Number(this.abonoInput.value) || 0;
      if (amountPaid <= 0 || amountPaid >= 10000) {
        UI.showToast('El abono debe ser mayor a $0 y menor a $10.000', 'warning');
        this.abonoInput.focus();
        return;
      }
    }

    this.onSaveTicket(this.activeNumber, {
      buyerName,
      status,
      amountPaid
    });

    this.closeTicketModal();
  },

  /**
   * Release ticket confirmation
   */
  handleRelease() {
    if (!this.activeNumber) return;
    if (confirm(`¿Liberar el número ${this.activeNumber} y borrar sus datos de pago?`)) {
      this.onReleaseTicket(this.activeNumber);
      this.closeTicketModal();
    }
  },

  /**
   * Opens the safe reset confirmation modal
   */
  openResetModal() {
    if (this.resetInput) {
      this.resetInput.value = '';
    }
    if (this.btnConfirmReset) {
      this.btnConfirmReset.disabled = true;
    }
    this.resetModal.classList.add('abierto');
    setTimeout(() => {
      if (this.resetInput) this.resetInput.focus();
    }, 50);
  },

  closeResetModal() {
    this.resetModal.classList.remove('abierto');
  },

  /**
   * Confirms the reset after user types REINICIAR
   */
  handleConfirmReset() {
    const text = this.resetInput.value.trim().toUpperCase();
    if (text !== 'REINICIAR') {
      const card = this.resetModal.querySelector('.card');
      if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
      }
      return;
    }

    this.onConfirmReset('REINICIAR');
    this.closeResetModal();
  }
};

window.ModalManager = ModalManager;

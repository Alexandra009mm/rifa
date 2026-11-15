/**
 * Main application logic coordinating API, UI, and event listeners
 */
(function () {
  let tickets = [];
  let stats = null;
  let activeFilter = 'todos';
  let searchQuery = '';
  let syncTimer = null;

  const searchInput = document.getElementById('buscar');

  /**
   * Loads latest tickets and statistics from server
   */
  async function loadData(showToastOnSuccess = false) {
    try {
      const [fetchedTickets, fetchedStats] = await Promise.all([
        API.getTickets(),
        API.getStats()
      ]);

      tickets = fetchedTickets;
      stats = fetchedStats;

      renderView();

      if (showToastOnSuccess) {
        UI.showToast('Datos sincronizados correctamente');
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      UI.showToast(err.message || 'Error de conexión con el servidor', 'error');
      if (tickets.length === 0) {
        UI.renderError(err.message || 'Error de conexión con la base de datos', () => loadData(true));
      }
    }
  }

  /**
   * Refreshes UI based on current state, filters, and search
   */
  function renderView() {
    UI.renderStats(stats);
    UI.renderGrid(tickets, onNumberClick, activeFilter, searchQuery);
    UI.renderTable(tickets, onNumberClick, activeFilter, searchQuery);
  }

  /**
   * When user clicks a number in grid or table
   */
  function onNumberClick(number) {
    const ticket = tickets.find(t => t.ticketNumber === number);
    if (ticket) {
      ModalManager.openTicketModal(ticket);
    }
  }

  /**
   * Handles saving/updating ticket details
   */
  async function handleSaveTicket(number, data) {
    try {
      await API.updateTicket(number, data);
      UI.showToast(`Número ${number} actualizado`);
      await loadData();
    } catch (err) {
      UI.showToast(err.message, 'error');
    }
  }

  /**
   * Handles releasing an assigned ticket
   */
  async function handleReleaseTicket(number) {
    try {
      await API.releaseTicket(number);
      UI.showToast(`Número ${number} liberado`);
      await loadData();
    } catch (err) {
      UI.showToast(err.message, 'error');
    }
  }

  /**
   * Handles safe reset of all tickets
   */
  async function handleConfirmReset(confirmation) {
    try {
      await API.resetAll(confirmation);
      UI.showToast('Se ha reiniciado la rifa exitosamente', 'warning');
      await loadData();
    } catch (err) {
      UI.showToast(err.message, 'error');
    }
  }

  /**
   * Copies formatted participants list with payment status to clipboard
   */
  async function handleCopyList() {
    try {
      const exportText = await API.getExportList();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(exportText);
        UI.showToast('Lista copiada al portapapeles');
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = exportText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        UI.showToast('Lista copiada');
      }
    } catch (err) {
      UI.showToast('No se pudo copiar la lista', 'error');
    }
  }

  /**
   * Setup auto-sync polling across multiple devices
   */
  function startSyncPolling() {
    // Poll every 7 seconds if no modal is active
    syncTimer = setInterval(() => {
      const isTicketModalOpen = document.getElementById('modal')?.classList.contains('abierto');
      const isResetModalOpen = document.getElementById('modal-reset')?.classList.contains('abierto');

      if (!isTicketModalOpen && !isResetModalOpen) {
        loadData(false);
      }
    }, 7000);
  }

  /**
   * Bind DOM event listeners
   */
  function setupEventListeners() {
    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderView();
      });
    }

    // Clear search
    const btnLimpiar = document.getElementById('btn-limpiar');
    if (btnLimpiar) {
      btnLimpiar.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        renderView();
      });
    }

    // Copy list
    const btnCopiar = document.getElementById('btn-copiar');
    if (btnCopiar) {
      btnCopiar.addEventListener('click', handleCopyList);
    }

    // Reset button triggers safe modal
    const btnReiniciar = document.getElementById('btn-reiniciar');
    if (btnReiniciar) {
      btnReiniciar.addEventListener('click', () => {
        ModalManager.openResetModal();
      });
    }

    // Filter chips
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('activo'));
        chip.classList.add('activo');
        activeFilter = chip.dataset.filter;
        renderView();
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        ModalManager.closeTicketModal();
        ModalManager.closeResetModal();
      }
      if (e.key === 'Enter') {
        if (document.getElementById('modal')?.classList.contains('abierto')) {
          ModalManager.handleSave();
        } else if (document.getElementById('modal-reset')?.classList.contains('abierto')) {
          ModalManager.handleConfirmReset();
        }
      }
    });

    // Modal action buttons
    document.getElementById('btn-guardar')?.addEventListener('click', () => ModalManager.handleSave());
    document.getElementById('liberar')?.addEventListener('click', () => ModalManager.handleRelease());
    document.getElementById('btn-cancelar')?.addEventListener('click', () => ModalManager.closeTicketModal());
    document.getElementById('btn-close-ticket')?.addEventListener('click', () => ModalManager.closeTicketModal());

    document.getElementById('btn-confirm-reset')?.addEventListener('click', () => ModalManager.handleConfirmReset());
    document.getElementById('btn-cancel-reset')?.addEventListener('click', () => ModalManager.closeResetModal());
    document.getElementById('btn-close-reset')?.addEventListener('click', () => ModalManager.closeResetModal());
  }

  // Initialize application
  window.addEventListener('DOMContentLoaded', () => {
    ModalManager.init({
      onSaveTicket: handleSaveTicket,
      onReleaseTicket: handleReleaseTicket,
      onConfirmReset: handleConfirmReset
    });

    setupEventListeners();
    loadData();
    startSyncPolling();
  });
})();

window.addEventListener('load', (event) => {
  if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
  }
  const customerData = [
    {
      email: 'mike@gmail.com',
      fname: 'Mike',
      lname: 'Oliver'
    },
    {
      email: 'rudolf@gmail.com',
      fname: 'Anthony',
      lname: 'Rudolf'
    }
  ]
  let customers = [];
  let db;
  const dbName = 'customerDb';
  let request = indexedDB.open(dbName, 1);

  request.onerror = function(event) {
    console.error('Database error: ' + event.target.errorCode);
  };

  request.onsuccess = function(event) {
    db = event.target.result;
    getAllCustomers(db);
    console.log(db);
  };

  request.onupgradeneeded = function(event) {
    db = event.target.result;
    let objectStore = db.createObjectStore('customers', { keyPath: 'email'});
    objectStore.createIndex('email', 'email');
    objectStore.createIndex('fname', 'fname');
    objectStore.createIndex('lname', 'lname');
    objectStore.transaction.oncomplete = function(event) {
      let customerObjectStore = db.transaction('customers', 'readwrite').objectStore('customers');
      customerData.forEach(function(customer) {
        customerObjectStore.add(customer);
      });
    };
  }
  
  // show Customers 
  function showCustomers(customers) {
    if(customers.length === 0) {
      return;
    }
    const result = customers.map((customer) => {
      return `<div class="customer">
                <p><strong>First Name:</strong> ${customer.fname}</p>
                <p><strong>Last Name:</strong> ${customer.lname}</p>
                <p>${customer.email}</p>
                <button class="update">Update</button>
                <button class="delete">Delete</button>
              </div>
              <hr>`
    }).join('');
    document.getElementById('customers').innerHTML = result;
    let del = document.querySelectorAll('.delete');
    let Upd = document.querySelectorAll('.update');
    
    // Add delete handler
    del.forEach(element => {
      element.addEventListener('click', (e) => {
        deleteCustomer(e.target.parentNode.children[2].textContent);
      });
    });
    // Add update handler
    Upd.forEach(element => {
      element.addEventListener('click', (e) => {
        showModal(e.target.parentNode.children[2].textContent);
      });
    });
  }

  // show Modal  
  function showModal(customerEmail) {
    let span = document.getElementsByClassName('close')[0];
    let modal = document.getElementById('myModal');
    span.onclick = function() {
      modal.style.display = 'none';
    }
    modal.style.display = 'block';
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }

    // get current customer details
    let transaction = db.transaction('customers');
    let objectStore = transaction.objectStore('customers');
    let index = objectStore.index('email');
    index.get(customerEmail).onsuccess = function(event) {
      document.getElementById('modal-first-name').value = event.target.result.fname;
      document.getElementById('modal-last-name').value = event.target.result.lname;
      document.getElementById('modal-email').value = event.target.result.email;
    }
  }

  // Delete Customer
  function deleteCustomer(customer) {
    let transaction = db.transaction('customers', 'readwrite');
    transaction.oncomplete = function(event) {
      console.log('All done');
    }
    transaction.onerror = function(event) {
      transaction.abort();
      console.error('Transaction Error')
    }
    let customerObjectStore = transaction.objectStore('customers');
    let request = customerObjectStore.delete(customer);
    request.onsuccess = function(event) {
      getAllCustomers(db);
      console.log('Customer Deleted')
    }
    request.onerror = function(event) {
      console.error('Error Adding Customer');
    }
  }

  // Get all Data
  function getAllCustomers(db) {
    customers = [];
    let transaction = db.transaction('customers', 'readonly');
    let customerObjectStore = transaction.objectStore('customers');
    customerObjectStore.openCursor().onsuccess = function(event) {
      let cursor = event.target.result;
      if (cursor) {
        customers.push(cursor.value);
        cursor.continue();
      } else {
        showCustomers(customers);
      }
    }
  };
  
  // Add Customer
  const form = document.getElementById('form');
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    let formData = new FormData(form);
    let customer = {}
    for (const [key, value] of formData) {
      customer[key] = value.trim();
    }
    
    // save to indexdb
    let transaction = db.transaction('customers', 'readwrite');
    transaction.oncomplete = function(event) {
      console.log('All done');
    }
    transaction.onerror = function(event) {
      transaction.abort();
      console.error('Transaction Error')
    }
    let customerObjectStore = transaction.objectStore('customers');
    let request = customerObjectStore.add(customer);
    request.onsuccess = function(event) {
      getAllCustomers(db);
      form.reset();
      console.log('Customer Added')
    }
    request.onerror = function(event) {
      console.error('Error Adding Customer');
    }
  });

  // update Customer
  const updateForm =  document.getElementById('modalForm');
  updateForm.addEventListener('submit', (event) => {
    event.preventDefault();
    let formData = new FormData(updateForm);
    let customer = {}
    for (const [key, value] of formData) {
      customer[key] = value;
    }
    // customer.email = document.getElementById('modal-email').value;


    let transaction = db.transaction('customers', 'readwrite');
    let objectStore = transaction.objectStore('customers');
    let index = objectStore.index('email');
    index.get(customer.email).onsuccess = function(event) {
     let requestUpdate = objectStore.put(customer);
      requestUpdate.onerror = function(event) {
        console.error('Erorr updating')
      };
      requestUpdate.onsuccess = function(event) {
        document.getElementById('myModal').style.display = 'none';
        getAllCustomers(db);
        console.log('update Successful')
      };
    }

  });

});
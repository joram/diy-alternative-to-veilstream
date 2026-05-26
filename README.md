# How to give AI access to your production database safely
(or how to DIY instead of using VeilStream)


## Use Case 1: Customer Support
someone from support wants to help debug the user's problems by logging in "as them".

There's sensitive information in the database for each user, so we should anonymize that.

### Anonymize the data with PGanon
- Step 1: Add the DaLibo Labs DEB Repo to your system.
```
apt install curl lsb-release
echo deb http://apt.dalibo.org/labs $(lsb_release -cs)-dalibo main > /etc/apt/sources.list.d/dalibo-labs.list
curl -fsSL -o /etc/apt/trusted.gpg.d/dalibo-labs.gpg https://apt.dalibo.org/labs/debian-dalibo.gpg
apt update
```

- Step 2: Deploy
```
sudo apt install postgresql_anonymizer_18
```

- Step 3: Load the extension.
```
ALTER DATABASE foo SET session_preload_libraries = 'anon';
```

- Step 4: Close your session and open a new one. Create the extension.
```
CREATE EXTENSION anon;
SELECT anon.init();
```

##### Notes
* For this example we'll use a docker image
* Extension not available on RDS (sorry)
* postgresql_anonymizer_18 not available yet

### Dynamic Masking
![img](https://postgresql-anonymizer.readthedocs.io/en/stable/images/anon-Dynamic.drawio.png)

```
ALTER DATABASE boutique
  SET anon.transparent_dynamic_masking TO true;
```



## Use Case 2: LLM Chat Window

### RLS
this allows us to pass

### Restrict
- outside the sql, set the connection to read only.
- For every query, lets clearly scope
```
SELECT set_config('app.customer_id', $1, true)
SET LOCAL ROLE support_reader
SET search_path TO "+searchPath
SELECT * FROM (%s) AS scoped_query LIMIT %d
```


### Demo chats
- What were my most recent invoices?
- select * from customer where customer_id = 3
- select * from customer where customer_id = 4
- how much did fred spend?
- margins on latest invoice?


### Notes
- if a migration adds a new column or table?


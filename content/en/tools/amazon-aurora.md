---
slug: amazon-aurora
title: Amazon Aurora
category: Developer
price_model: Usage-based
tags:
  - database
  - cloud
  - developer tools
  - aws
official_url: 'https://aws.amazon.com/rds/aurora/'
description: 'Amazon Aurora is a relational database engine developed by Amazon Web Services (AWS), fully compatible with MySQL and PostgreSQL. It combines the performance and availability of commercial databases with the simplicity and cost-effectiveness of open-source databases. Aurora offers a high-performance, scalable, and secure cloud database solution ideal for developers and businesses that require reliable database services.'
translation: full
---
# Amazon Aurora

Amazon Aurora is a relational database engine developed by Amazon Web Services (AWS) that is fully compatible with MySQL and PostgreSQL. It combines the performance and availability of commercial databases with the simplicity and cost-effectiveness of open-source databases. Aurora provides a high-performance, scalable, and secure cloud database solution, ideal for developers and businesses seeking reliable database services.

## Who is Amazon Aurora for?

Amazon Aurora is designed for developers, IT architects, and businesses of all sizes looking for a powerful, scalable, and low-maintenance relational database in the cloud. It is especially suitable for:

- Applications with high transaction volumes that require low latency.
- Businesses looking to migrate existing MySQL or PostgreSQL databases without significant changes to their applications.
- Developers needing a fully managed database solution to focus on application development.
- Organizations seeking high availability and automatic scaling with minimal administrative overhead.
- Projects where security and compliance are paramount.

## Key Features

- **MySQL and PostgreSQL Compatibility:** Enables easy migration and integration with existing applications.
- **Automatic Scaling:** Adjusts storage capacity and compute power automatically based on demand.
- **High Availability:** Distributed architecture with Multi-AZ deployment and automatic failover.
- **Fast Performance:** Up to five times faster than standard MySQL databases through optimized storage and query engines.
- **Fully Managed:** Automatic backups, patching, and maintenance with no user effort required.
- **Security:** Encryption of data at rest and in transit, integration with AWS Identity and Access Management (IAM).
- **Point-in-Time Recovery:** Allows restoration of the database to any point within the retention period.
- **Serverless Option:** Aurora Serverless enables automatic scaling based on current load.
- **Integration with AWS Ecosystem:** Easy connection to other AWS services like Lambda, S3, CloudWatch, and more.

## Pros and Cons

### Pros

- High performance and scalability with low latency.
- Fully managed service greatly reduces administrative effort.
- Compatibility with popular open-source databases eases migration and development.
- Robust security features and compliance options.
- Flexible pricing based on actual usage.
- Automatic backups and recovery options enhance data integrity.

### Cons

- Costs can vary depending on usage and region and may not always be predictable.
- Limited control over underlying infrastructure compared to self-managed databases.
- Dependence on the AWS ecosystem might pose challenges for some organizations.
- Complexity in optimal configuration for very specific use cases.

## Pricing & Costs

Amazon Aurora uses a usage-based pricing model that charges based on compute power, storage capacity, and data transfer actually consumed. Prices vary by region, instance type, and storage option. Typically, charges apply for:

- **Compute Resources:** Billed per second based on instance size.
- **Storage:** Price per GB per month for used storage.
- **I/O Requests:** Fees for read and write operations.
- **Backup Storage:** Costs for storing automatic backups beyond the free allowance.
- **Data Transfer:** Charges for data transferred outside of AWS.

There is no minimum contract term, and usage can be adjusted flexibly. Free tier usage is available for small projects or testing but with limitations.

## Alternatives to Amazon Aurora

- **Google Cloud SQL:** Fully managed relational database supporting MySQL, PostgreSQL, and SQL Server.
- **Microsoft Azure SQL Database:** Cloud-based relational database with high availability and scalability.
- **DigitalOcean Managed Databases:** Easy-to-use managed databases with MySQL, PostgreSQL, and Redis.
- **PostgreSQL on Heroku:** Developer-friendly platform service offering PostgreSQL databases.
- **MariaDB SkySQL:** Cloud-based relational database focused on performance and scalability.

## FAQ

**1. Is Amazon Aurora compatible with existing MySQL or PostgreSQL applications?**  
Yes, Aurora is fully compatible with MySQL and PostgreSQL, easing migration and integration.

**2. What is Amazon Aurora's availability?**  
Aurora offers up to 99.99% availability through Multi-AZ deployments and automatic failover.

**3. What security features does Aurora offer?**  
Aurora supports encryption at rest and in transit, IAM integration, VPC isolation, and regular security updates.

**4. Can I run Amazon Aurora serverless?**  
Yes, Aurora Serverless automatically adjusts database resources based on load for cost-efficient operation.

**5. How does data backup work with Aurora?**  
Automatic backups are continuously created allowing point-in-time recovery. Backup storage is free up to a certain limit.

**6. What costs are involved with Amazon Aurora?**  
Costs are usage-based and depend on instance type, storage, I/O, and data transfer. Details vary by region and plan.

**7. Can I run Aurora on my own infrastructure?**  
Aurora is a fully managed cloud service and cannot be installed on-premises.

**8. How does Amazon Aurora scale with growing demand?**  
Aurora automatically adjusts storage and allows adding read replicas for improved performance and redundancy. Serverless options enable dynamic compute scaling.

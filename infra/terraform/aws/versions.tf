terraform {
  required_version = ">= 1.10, < 2.0"
  backend "s3" {}
  required_providers {
    aws = { source = "hashicorp/aws", version = "6.66.0" }
  }
}
provider "aws" {
  region = var.region
  default_tags { tags = { Project = "HackkyHub", Environment = var.environment, ManagedBy = "Terraform" } }
}

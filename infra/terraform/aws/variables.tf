variable "region" { type = string }
variable "environment" {
  type = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Use staging or production."
  }
}
variable "name" { type = string }
variable "vpc_cidr" { type = string }
variable "kubernetes_version" { type = string }
variable "github_repository" { type = string }
variable "operator_role_arn" { type = string }
variable "node_instance_type" { type = string }
variable "node_count" { type = number }
variable "nat_ha" { type = bool }

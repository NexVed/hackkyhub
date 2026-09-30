module "eks" {
  source                  = "terraform-aws-modules/eks/aws"
  version                 = "21.26.0"
  name                    = local.prefix
  kubernetes_version      = var.kubernetes_version
  endpoint_private_access = true
  endpoint_public_access  = false
  security_group_additional_rules = {
    deploy_runner = {
      description              = "HTTPS from the private deployment runner"
      protocol                 = "tcp"
      from_port                = 443
      to_port                  = 443
      type                     = "ingress"
      source_security_group_id = aws_security_group.deploy_runner.id
    }
  }
  deletion_protection                    = var.environment == "production"
  vpc_id                                 = aws_vpc.app.id
  subnet_ids                             = [for subnet in aws_subnet.private : subnet.id]
  enabled_log_types                      = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  cloudwatch_log_group_retention_in_days = 30
  enable_irsa                            = true
  addons = {
    coredns    = {}
    kube-proxy = {}
    vpc-cni    = { before_compute = true, configuration_values = jsonencode({ enableNetworkPolicy = "true" }) }
  }
  eks_managed_node_groups = {
    app = {
      instance_types   = [var.node_instance_type]
      ami_type         = "AL2023_x86_64_STANDARD"
      min_size         = var.node_count
      desired_size     = var.node_count
      max_size         = var.node_count + 3
      metadata_options = { http_tokens = "required", http_put_response_hop_limit = 1 }
    }
  }
  access_entries = {
    operator = {
      principal_arn       = var.operator_role_arn
      policy_associations = { admin = { policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy", access_scope = { type = "cluster" } } }
    }
    deployer = {
      principal_arn       = aws_iam_role.github.arn
      policy_associations = { deploy = { policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSAdminPolicy", access_scope = { type = "namespace", namespaces = [local.namespace] } } }
    }
  }
  depends_on = [aws_route.nat]
}
resource "aws_ecr_repository" "app" {
  for_each             = toset(["frontend", "scraper"])
  name                 = "${local.prefix}/${each.key}"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
  encryption_configuration { encryption_type = "AES256" }
  lifecycle { prevent_destroy = true }
}
resource "aws_ecr_lifecycle_policy" "app" {
  for_each   = aws_ecr_repository.app
  repository = each.value.name
  policy     = jsonencode({ rules = [{ rulePriority = 1, description = "Keep 50 released images", selection = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 50 }, action = { type = "expire" } }] })
}
resource "aws_secretsmanager_secret" "runtime" {
  for_each                = toset(["frontend", "scraper"])
  name                    = "${var.name}/${var.environment}/${each.key}"
  recovery_window_in_days = 30
  lifecycle { prevent_destroy = true }
  # Secret values are added outside Terraform so they never enter state.
}
output "cluster_name" { value = module.eks.cluster_name }
output "vpc_id" { value = aws_vpc.app.id }
output "oidc_provider_arn" { value = module.eks.oidc_provider_arn }
output "github_role_arn" { value = aws_iam_role.github.arn }
output "repositories" { value = { for name, repo in aws_ecr_repository.app : name => repo.repository_url } }
output "runtime_secret_arns" { value = { for name, secret in aws_secretsmanager_secret.runtime : name => secret.arn } }

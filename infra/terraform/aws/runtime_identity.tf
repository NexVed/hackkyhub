resource "aws_security_group" "deploy_runner" {
  name_prefix = "${local.prefix}-runner-"
  description = "Private ephemeral runner: outbound only; use SSM, not SSH"
  vpc_id      = aws_vpc.app.id
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_iam_role" "runtime_secrets" {
  name = "${local.prefix}-runtime-secrets"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = module.eks.oidc_provider_arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = { StringEquals = {
        "${module.eks.oidc_provider}:aud" = "sts.amazonaws.com"
        "${module.eks.oidc_provider}:sub" = "system:serviceaccount:${local.namespace}:runtime-secrets"
      } }
    }]
  })
}
resource "aws_iam_role_policy" "runtime_secrets" {
  role = aws_iam_role.runtime_secrets.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect   = "Allow"
    Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    Resource = [for secret in aws_secretsmanager_secret.runtime : secret.arn]
  }] })
}
output "runtime_secrets_role_arn" { value = aws_iam_role.runtime_secrets.arn }
output "deploy_runner_security_group_id" { value = aws_security_group.deploy_runner.id }
output "private_subnet_ids" { value = [for subnet in aws_subnet.private : subnet.id] }

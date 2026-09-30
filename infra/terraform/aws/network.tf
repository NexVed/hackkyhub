data "aws_availability_zones" "available" { state = "available" }
locals {
  azs       = slice(data.aws_availability_zones.available.names, 0, 3)
  prefix    = "${var.name}-${var.environment}"
  namespace = "hackkyhub-${var.environment}"
}
resource "aws_vpc" "app" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = local.prefix }
}
resource "aws_internet_gateway" "app" { vpc_id = aws_vpc.app.id }
resource "aws_subnet" "public" {
  for_each          = toset(local.azs)
  vpc_id            = aws_vpc.app.id
  availability_zone = each.key
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, index(local.azs, each.key))
  tags              = { "kubernetes.io/role/elb" = "1", Name = "${local.prefix}-public-${each.key}" }
}
resource "aws_subnet" "private" {
  for_each          = toset(local.azs)
  vpc_id            = aws_vpc.app.id
  availability_zone = each.key
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 10 + index(local.azs, each.key))
  tags              = { "kubernetes.io/role/internal-elb" = "1", Name = "${local.prefix}-private-${each.key}" }
}
resource "aws_route_table" "public" { vpc_id = aws_vpc.app.id }
resource "aws_route" "internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.app.id
}
resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}
resource "aws_eip" "nat" {
  for_each = toset(var.nat_ha ? local.azs : [local.azs[0]])
  domain   = "vpc"
}
resource "aws_nat_gateway" "app" {
  for_each      = aws_eip.nat
  allocation_id = each.value.id
  subnet_id     = aws_subnet.public[each.key].id
  depends_on    = [aws_internet_gateway.app]
}
resource "aws_route_table" "private" {
  for_each = aws_subnet.private
  vpc_id   = aws_vpc.app.id
}
resource "aws_route" "nat" {
  for_each               = aws_route_table.private
  route_table_id         = each.value.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.app[var.nat_ha ? each.key : local.azs[0]].id
}
resource "aws_route_table_association" "private" {
  for_each       = aws_subnet.private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private[each.key].id
}

import { adminRequest } from "../../../lib/api/client"
import {
  demoAssignRedeemCode,
  demoCreateRedeemCode,
  demoDisableRedeemCode,
  demoListRedeemCodes,
} from "../../demo/store"
import type {
  AssignRedeemCodeInput,
  CreateRedeemCodeInput,
  RedeemCode,
} from "../types"

export async function fetchRedeemCodes(): Promise<RedeemCode[]> {
  return adminRequest<RedeemCode[]>("redeemCodes.list", {}, () =>
    demoListRedeemCodes(),
  )
}

export async function createRedeemCode(
  input: CreateRedeemCodeInput,
): Promise<RedeemCode> {
  return adminRequest<RedeemCode>("redeemCodes.create", input, () =>
    demoCreateRedeemCode(input),
  )
}

export async function assignRedeemCode(
  input: AssignRedeemCodeInput,
): Promise<RedeemCode> {
  return adminRequest<RedeemCode>("redeemCodes.assign", input, () =>
    demoAssignRedeemCode(input),
  )
}

export async function disableRedeemCode(id: string): Promise<RedeemCode> {
  return adminRequest<RedeemCode>("redeemCodes.disable", { id }, () =>
    demoDisableRedeemCode(id),
  )
}

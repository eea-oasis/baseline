import { useLazyQuery } from "@apollo/react-hooks";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ApproveFooter from "../components/ApproveFooter";
import RateTable from "../components/RateTable";
import Signatures from "../components/Signatures";
import SKUTable from "../components/SKUTable";
import { ServerSettingsContext } from "../contexts/server-settings-context";
import { GET_MSA_BY_ID } from "../graphql/msa";
import { GET_PARTNER_BY_IDENTITY } from "../graphql/partners";
import { GET_PROPOSAL_BY_RFP_AND_SUPPLIER } from "../graphql/proposal";
import { GET_RFP } from "../graphql/rfp";

const MSADetail = () => {
  const { id } = useParams();
  const [isBuyer, setIsBuyer] = useState(true);
  const [fetchMSA, { data: msaData }] = useLazyQuery(GET_MSA_BY_ID);
  const { msa } = msaData || {};

  const [fetchRFP, { data: rfpData }] = useLazyQuery(GET_RFP);
  const { rfp } = rfpData || {};

  const [fetchProposal, { data: proposalData }] = useLazyQuery(
    GET_PROPOSAL_BY_RFP_AND_SUPPLIER
  );
  const { getProposalByRFPAndSupplier: proposal } = proposalData || {};

  const [getPartnerByIdentity, { data: partnerData }] = useLazyQuery(
    GET_PARTNER_BY_IDENTITY
  );
  const { getPartnerByMessagingKey: buyer } = partnerData || {};
  const { name, address } = buyer || {};

  const [getSupplierByIdentity, { data: supplierData }] = useLazyQuery(
    GET_PARTNER_BY_IDENTITY
  );
  const { getPartnerByMessagingKey: supplier } = supplierData || {};

  const { settings } = useContext(ServerSettingsContext);
  const { organizationAddress } = settings ? settings : {};

  useEffect(() => {
    if (!msa) {
      fetchMSA({ variables: { id } });
    }
    if (msa) {
      fetchRFP({ variables: { uuid: msa.rfpId } });
      fetchProposal({
        variables: { sender: msa.whisperPublicKeySupplier, rfpId: msa.rfpId },
      });
    } // TODO: Whisper depreciation
  }, [fetchMSA, msa, id, fetchRFP, fetchProposal]);

  useEffect(() => {
    if (organizationAddress && address) {
      address === organizationAddress ? setIsBuyer(true) : setIsBuyer(false);
    }
  }, [organizationAddress, address]);

  useEffect(() => {
    if (rfp) getPartnerByIdentity({ variables: { identity: rfp.sender } });
    if (msa)
      getSupplierByIdentity({
        variables: { identity: msa.whisperPublicKeySupplier },
      });
  }, [getPartnerByIdentity, rfp, msa, getSupplierByIdentity]);
  // TODO: Whisper depreciation
  if (!msaData) return "Not Found";

  return (
    <Container>
      {rfp && <Typography variant="h2">{rfp.description}</Typography>}
      {buyer && <Typography>{name}</Typography>}
      {rfp && <SKUTable sku={rfp.sku} description={rfp.skuDescription} />}
      <Grid container>
        {proposal && (
          <>
            <Grid item>
              <RateTable
                rates={proposal.rates}
                erc20ContractAddress={proposal.erc20ContractAddress}
              />
            </Grid>
            <Grid item style={{ marginLeft: "10rem" }}>
              <Typography variant="h3">Conditions</Typography>
              <Typography>None</Typography>
            </Grid>
          </>
        )}
      </Grid>
      {buyer && supplier && (
        <Signatures
          buyer={buyer}
          supplier={supplier} // NOTE: ::Supplier::
          supplierStatus={msa.supplierSignatureStatus}
          buyerStatus={msa.buyerSignatureStatus}
        />
      )}
      {!isBuyer && !msa.supplierSignatureStatus && (
        <ApproveFooter onClick={() => console.log("hello")} />
      )}
    </Container>
  );
};

export default MSADetail;
